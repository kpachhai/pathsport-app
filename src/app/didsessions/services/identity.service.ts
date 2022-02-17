import { Injectable, NgZone } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { DIDStore } from '../model/didstore.model';
import { NewIdentity } from '../model/newidentity';
import { identity } from 'rxjs';
import { DID, CredentialAvatar } from '../model/did.model';
import { resolve } from 'url';
import { DIDHelper } from '../helpers/did.helper';
import { PasswordManagerCancellationException } from '../model/exceptions/passwordmanagercancellationexception';
import { PopupProvider } from './popup';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';
// import { timingSafeEqual } from 'crypto';
import { TranslateService } from '@ngx-translate/core';
import { WrongPasswordException } from '../model/exceptions/wrongpasswordexception.exception';
import { BiometricAuthenticationFailedException } from '../model/exceptions/biometricauthenticationfailed.exception';
import { BiometricLockedoutException } from '../model/exceptions/biometriclockedout.exception';
import { UXService } from './ux.service';
import {
  GlobalDIDSessionsService,
  IdentityEntry,
  SignInOptions,
} from 'src/app/services/global.didsessions.service';
import { GlobalLanguageService } from 'src/app/services/global.language.service';
import { Logger } from 'src/app/logger';
import { Events } from 'src/app/services/events.service';
import { DIDMnemonicHelper } from '../helpers/didmnemonic.helper';
import { GlobalNativeService } from 'src/app/services/global.native.service';
import { GlobalElastosAPIService } from 'src/app/services/global.elastosapi.service';
import { GlobalPreferencesService } from 'src/app/services/global.preferences.service';
import { GlobalHiveService } from 'src/app/services/global.hive.service';
import { GlobalStorageService } from 'src/app/services/global.storage.service';
import { GlobalNavService } from 'src/app/services/global.nav.service';
import { GlobalStartupService } from 'src/app/services/global.startup.service';
import { App } from 'src/app/model/app.enum';
import { environment } from 'src/environments/environment';
import { GlobalJsonRPCService } from 'src/app/services/global.jsonrpc.service';

declare let internalManager: InternalPlugin.InternalManager;
declare let didManager: DIDPlugin.DIDManager;
declare let passwordManager: PasswordManagerPlugin.PasswordManager;

export type IdentityGroup = {
  didStoreId: string;
  entries: IdentityEntry[];
};

export type stepCompletionCallback = (data: any) => void | Promise<any>;

export type NextStep = {
  id: number;
  route: string;
  completionCb: stepCompletionCallback;
};

export type NavigateWithCompletionEnterData = {
  stepId: number;
  data?: any;
};

@Injectable({
  providedIn: 'root',
})
export class IdentityService {
  private mnemonicLang: DIDPlugin.MnemonicLanguage = 'ENGLISH';
  public identityBeingCreated: NewIdentity = null;
  private nextSteps = new Array<NextStep>();
  public signedIdentity: IdentityEntry;

  public popup = false;

  constructor(
    public zone: NgZone,
    private events: Events,
    private popupProvider: PopupProvider,
    private language: GlobalLanguageService,
    private translate: TranslateService,
    private alertCtrl: AlertController,
    private uxService: UXService,
    private nativeService: GlobalNativeService,
    private globalNavService: GlobalNavService,
    private prefs: GlobalPreferencesService,
    private storage: GlobalStorageService,
    private globalElastosAPIService: GlobalElastosAPIService,
    private globalHiveService: GlobalHiveService,
    private globalStartupService: GlobalStartupService,
    private didSessions: GlobalDIDSessionsService,
    private globalJsonRPCService: GlobalJsonRPCService
  ) {
    this.events.subscribe('signIn', (identity) => {
      this.zone.run(() => {
        void this.signIn(identity);
      });
    });
    this.events.subscribe('deleteIdentity', (identity) => {
      this.zone.run(() => {
        void this.deleteIdentity(identity);
      });
    });
  }

  init() {
    this.setMnemonicLangByLanguage(this.translate.currentLang);
    this.translate.onLangChange.subscribe((data) => {
      this.setMnemonicLangByLanguage(data.lang);
    });
  }

  generateMnemonic(): Promise<string> {
    return new Promise((resolve, reject) => {
      didManager.generateMnemonic(
        this.getMnemonicLang(),
        (ret) => {
          resolve(ret);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  isMnemonicValid(language, mnemonic): Promise<any> {
    return new Promise((resolve, reject) => {
      didManager.isMnemonicValid(
        language,
        mnemonic,
        (ret) => {
          resolve(ret);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }

  public async signIn(identityEntry: IdentityEntry, goToLauncher = false) {
    // Security check: ask user to enter the password for the target did.
    try {
      let options: PasswordManagerPlugin.GetPasswordInfoOptions = {
        promptPasswordIfLocked: true,
        forceMasterPasswordPrompt: false,
      };
      let passwordInfo = await passwordManager.getPasswordInfo(
        'didstore-' + identityEntry.didStoreId,
        options
      );
      if (passwordInfo) {
        let signInOptions: SignInOptions = null;
        // TODO: while the code below is commented out, if a user change the language in did sessions, this will also
        // change any other signing in user's language. (BUG)
        // if (this.language.languageWasChangedByUser()) {
        Logger.log(
          'didsessions',
          'Language changed by user. Passing session language to be: ' +
            this.language.activeLanguage.value
        );
        signInOptions = {
          sessionLanguage: this.language.activeLanguage.value,
        };
        //}

        await this.didSessions.signIn(identityEntry, signInOptions);

        if (goToLauncher)
          await this.globalStartupService.navigateToStartupScreen();
      } else {
        Logger.warn(
          'didsessions',
          'Failed to authentify using password. Sign in not permitted.'
        );
      }
    } catch (e) {
      Logger.log('didsessions', 'passwordManager.getPasswordInfo :', e);
      let reworkedEx = DIDHelper.reworkedPluginException(e);
      if (
        reworkedEx instanceof PasswordManagerCancellationException ||
        reworkedEx instanceof WrongPasswordException ||
        reworkedEx instanceof BiometricAuthenticationFailedException ||
        reworkedEx instanceof BiometricLockedoutException
      ) {
        // Nothing to do, just stop the flow here.
      } else {
        throw e;
      }
    }
  }

  signOut(): Promise<void> {
    return this.didSessions.signOut();
  }

  async getSignedIdentity(): Promise<void> {
    let id: IdentityEntry = await this.didSessions.getSignedInIdentity();
    Logger.log('didsessions', 'Signed in DID', id);
    this.signedIdentity = id;
  }

  /**
   * Returns the DIDDocument of the currently being created identity.
   */
  public getCreatedDIDDocument(): Promise<DIDPlugin.DIDDocument> {
    return this.identityBeingCreated.didStore.loadDIDDocument(
      this.identityBeingCreated.did.getDIDString()
    );
  }

  // temporary navigation to edit interests
  public navigateEditInterests() {
    this.uxService.go('/didsessions/editinterests');
  }

  public navigateEditAvatar() {
    this.uxService.go('/didsessions/editavatar');
  }

  public startCreatingNewDIDWithNewMnemonic() {
    this.identityBeingCreated = new NewIdentity();

    Logger.log('didsessions', 'Navigating to profile edition');
    this.navigateWithCompletion(
      '/didsessions/editprofile',
      async ({ name, location }) => {
        this.identityBeingCreated.name = name as string;
        this.identityBeingCreated.country = location as string;
        //this.uxService.go('/didsessions/backupdid', { state: { create: true } });
        //this.uxService.go('/didsessions/preparedid');
        await this.createNewDIDWithNewMnemonic();
      }
    );
  }

  async createNewDIDWithNewMnemonic() {
    Logger.log('didsessions', 'Creating new did with new mnemonic');
    await this.nativeService.showLoading(
      this.translate.instant('common.please-wait')
    );

    // Automatically find and use the best elastos API provider
    await this.globalElastosAPIService.autoDetectTheBestProvider();

    this.identityBeingCreated.mnemonic = await this.generateMnemonic();

    let didStore = await DIDStore.create();

    // Generate a random password
    this.identityBeingCreated.storePass =
      await passwordManager.generateRandomPassword();
    let mnemonicLanguage = this.getMnemonicLang();
    let mnemonic = this.identityBeingCreated.mnemonic;

    // Initialize the new DID store with a mnemonic and store password
    await didStore.createPrivateIdentity(
      null,
      this.identityBeingCreated.storePass,
      mnemonicLanguage,
      mnemonic
    );

    // Add a first (and only) identity to the store.
    Logger.log(
      'didsessions',
      'Adding DID with info name:',
      this.identityBeingCreated.name,
      'Adding DID with info location:',
      this.identityBeingCreated.country
    );
    let createdDID = await didStore.addDID(
      this.identityBeingCreated,
      this.identityBeingCreated.storePass
    );
    await this.nativeService.hideLoading();
    await this.finalizeIdentityCreation(
      didStore,
      this.identityBeingCreated.storePass,
      createdDID,
      this.identityBeingCreated.name,
      false,
      this.identityBeingCreated.country
    );
  }

  private async finalizeIdentityCreation(
    didStore: DIDStore,
    storePassword: string,
    createdDID: DID,
    identityName: string,
    isImportOperation: boolean,
    identityLocation?: string
  ): Promise<boolean> {
    try {
      console.log(
        'Time to create user, auth token and player from finalizeIdentityCreation: ',
        createdDID.getDIDString()
      );

      const apiUser = await this.createAPIUser(
        createdDID.getDIDString(),
        storePassword
      );
      console.log('api user created: ', apiUser);
      const apiAuthToken = await this.createAPIAuthToken(
        createdDID.getDIDString(),
        storePassword
      );
      console.log('Auth Token generated: ', apiAuthToken);

      await this.storage.setSetting(
        createdDID.getDIDString(),
        'didsession',
        '_accessToken',
        apiAuthToken.accessToken
      );

      const _accessToken = await this.storage.getSetting(
        createdDID.getDIDString(),
        'didsession',
        '_accessToken',
        ''
      );
      console.log(_accessToken);

      const apiPlayer = await this.createAPIPlayer(
        _accessToken,
        createdDID.getDIDString(),
        identityName
      );

      // console.log('Waqas: ', identityLocation);
      // Save the did store password with a password
      let passwordInfo: PasswordManagerPlugin.GenericPasswordInfo = {
        type: PasswordManagerPlugin.PasswordType.GENERIC_PASSWORD,
        key: 'didstore-' + didStore.getId(),
        displayName: 'DID store password',
        password: storePassword,
        // TODO: visible: false
      };
      let result = await passwordManager.setPasswordInfo(passwordInfo);
      if (result.value) {
        await this.nativeService.showLoading(
          this.translate.instant('common.please-wait')
        );
        // Main Password was created and did store password could be saved
        // Save the identity entry in the did session plugin
        // IMPORTANT: Don't set the avatar here before signing in. Because the avatar could be stored on hive,
        // And currently hive needs a user to be signed in to generate a APPID credential during its auth.
        // The identity is updated just after signing in below, with the avatar.
        this.identityBeingCreated.name = identityName;
        this.identityBeingCreated.country = identityLocation;
        this.identityBeingCreated.didStore = didStore;
        this.identityBeingCreated.did = createdDID;
        this.identityBeingCreated.didSessionsEntry = await this.addIdentity(
          didStore.getId(),
          createdDID.getDIDString(),
          identityName,
          null,
          identityLocation
        );

        await this.nativeService.hideLoading();

        //await this.signIn(this.identityBeingCreated.didSessionsEntry);
        this.navigateWithCompletion('/didsessions/preparedid', async () => {
          Logger.log(
            'didsessions',
            'DID preparation is complete, now navigating to interest (previously home) screen'
          );

          // IMPORTANT: We UPDATE the new identity with the avatar here after signing in. See comment above.
          let avatar = createdDID.getAvatarCredentialValue();
          this.identityBeingCreated.didSessionsEntry = await this.addIdentity(
            didStore.getId(),
            createdDID.getDIDString(),
            identityName,
            avatar,
            identityLocation
          );

          // Imported DIDs are automatically marked as backed up, no need to remind users about this.
          if (isImportOperation)
            await this.didSessions.markActiveIdentityBackedUp();

          this.navigateEditInterests();

          // Navigating to interests screen
          //TODO: move preparedid slides to top as per design for interests selection while publishing is in progress
          // void this.didSessions.navigateHome();
        });
        return;
      } else {
        // Go back to the default screen, creating the new DID is cancelled.
        Logger.log(
          'didsessions',
          'Password input failed. Aborting identity creation.'
        );
      }
    } catch (e) {
      let reworkedEx = DIDHelper.reworkedPluginException(e);
      if (
        reworkedEx instanceof PasswordManagerCancellationException ||
        reworkedEx instanceof WrongPasswordException ||
        reworkedEx instanceof BiometricAuthenticationFailedException ||
        reworkedEx instanceof BiometricLockedoutException
      ) {
        // Nothing to do, just stop the flow here.
        Logger.log(
          'didsessions',
          'Password input cancelled. Stopping identity creation.'
        );

        // Delete the did store
        await this.deleteDIDStore(didStore.getId());
        return false;
      } else {
        throw e;
      }
    }

    await this.uxService.navigateRoot();
  }

  /**
   * Flow:
   * - User types his 12 mnemonic words
   * - Create a new DID store (shared with did app - based on the given mnemonic) + automatic did store password
   * - Synchronize the created store with chain
   * - IMPORTANT: we support only 1 DID STORE = 1 DID. If several DIDs are derived from the same mnemonic (hdkey),
   *   we take only the FIRST one. Other DIDs are NOT supported.
   * - If there is a synchronized DID:
   *      - Try to extract a name from credentials.
   *          - If no credential, prompt name to user
   * - If no DID in the mnemonic:
   *      - Tell user that no identity was found, and that he can create a new one
   *      - Ask name to user
   *      - Create a new DID in store + add credential with the name
   * - Then:
   *      - Set a virtual did context to the password manager (using the created did string)
   *        (so the password manager can save the did store password in the DID session password sandbox,
   *         without being signed in yet)
   *      - Save the did store password to the password manager (will ask to create a password)
   *      - If password created, add a did session identity entry with did string, user name
   *      - Sign in with the new DID in did session plugin. DID session app is closed and launcher is started.
   */
  async startImportingMnemonic(existingMnemonic?: string) {
    this.identityBeingCreated = new NewIdentity();
    Logger.log(
      'didsessions',
      'startImportingMnemonic existingMnemonic:',
      existingMnemonic
    );
    if (!existingMnemonic) {
      Logger.log('didsessions', 'Navigating to import DID');
      this.navigateWithCompletion('/didsessions/importdid', (mnemonic) => {
        this.identityBeingCreated.mnemonic = mnemonic;
        void this.createStoreAfterImport();
      });
    } else {
      this.identityBeingCreated.mnemonic = existingMnemonic;
      await this.createStoreAfterImport();
    }
  }

  private async createStoreAfterImport() {
    Logger.log('didsessions', 'Create store after import');

    // Automatically find and use the best elastos API provider
    await this.globalElastosAPIService.autoDetectTheBestProvider();

    let didStore = await DIDStore.create();
    Logger.log('didsessions', 'Getting didStore', didStore);

    // Generate a random password
    let storePassword = await passwordManager.generateRandomPassword();
    this.identityBeingCreated.storePass = storePassword;

    let mnemonic = this.identityBeingCreated.mnemonic;
    let mnemonicLanguage = this.identityBeingCreated.mnemonicLanguage;
    if (!mnemonicLanguage) {
      mnemonicLanguage = await DIDMnemonicHelper.getMnemonicLanguage(mnemonic);
    }

    // Initialize the new DID store with a mnemonic and store password
    await didStore.createPrivateIdentity(
      this.identityBeingCreated.mnemonicPassphrase,
      storePassword,
      mnemonicLanguage,
      mnemonic
    );

    // Synchronize the store with chain
    Logger.log('didsessions', 'Synchronizing identities');
    await this.uxService.showLoading(
      this.translate.instant('didsessions.retrieve-prompt')
    );

    try {
      try {
        await didStore.synchronize(storePassword);
      } catch (e) {
        // Special case - "invalid signature" during synchronize - bug of getdids.com DIDs.
        // Recommend user to create a new DID
        if (e && new String(e).indexOf('signature mismatch') > 0) {
          Logger.warn(
            'didsessions',
            'Corrupted user DID, synchronize() has failed. Need to create a new DID'
          );

          await this.uxService.hideLoading();
          void this.popupProvider
            .ionicAlert(
              'Corrupted DID error',
              'Apparently, your DID is corrupted and Essentials cannot recover it. The only solution for now is to create a new DID.',
              'Got it'
            )
            .then(() => {
              void this.globalNavService.navigateDIDSessionHome();
            });

          return;
        } else {
          throw e;
        }
      }
      void this.uxService.hideLoading();

      // Check if we could retrieve a DID or not.
      if (didStore.dids.length > 0) {
        // We could sync at least one DID from chain
        Logger.log(
          'didsessions',
          didStore.dids.length + ' DIDs could be retrieved on chain'
        );

        if (didStore.dids.length === 1) {
          Logger.log(
            'didsessions',
            'Exactly one DID was synced. Using this one directly.'
          );

          // Exactly one DID was synced, so we directly use this one
          let createdDID = didStore.dids[0];
          void this.continueImportAfterCreatedDID(
            didStore,
            storePassword,
            createdDID
          );
        } else {
          Logger.log(
            'didsessions',
            'More than one DID was synced, asking user to pick one'
          );

          // More than one did was synced. Ask user which one he wants to keep during this import,
          // as for now we only allow one import at a time.
          this.navigateWithCompletion(
            '/didsessions/chooseimporteddid',
            (createdDID) => {
              void this.continueImportAfterCreatedDID(
                didStore,
                storePassword,
                createdDID
              );
            },
            {
              dids: didStore.dids,
            }
          );
        }
      } else {
        // No DID could be retrieved, so we need to create one.
        Logger.log('didsessions', 'No DID found on chain. Creating a new one.');

        // TODO: show popup to user to tell him that no identity could be retrieved on chain, and that he can
        // create a new profile
        this.navigateWithCompletion(
          '/didsessions/editprofile',
          async ({ name, location }) => {
            this.identityBeingCreated.name = name as string;
            this.identityBeingCreated.country = location as string;
            if (this.identityBeingCreated.name) {
              Logger.log(
                'didsessions',
                'Adding DID with info name:',
                this.identityBeingCreated.name
              );
              Logger.log(
                'didsessions',
                'Adding DID with info location/country:',
                this.identityBeingCreated.country
              );
              let createdDID = await didStore.addDID(
                this.identityBeingCreated,
                storePassword
              );
              await this.finalizeIdentityCreation(
                didStore,
                storePassword,
                createdDID,
                this.identityBeingCreated.name,
                true,
                this.identityBeingCreated.country
              );
            }
          }
        );
      }
    } catch (e) {
      void this.uxService.hideLoading();
      let reworkedEx = e ? e : 'No specific information';
      Logger.error('didsessions', 'createStoreAfterImport error', reworkedEx);
      await this.popupProvider.ionicAlert(
        'Synchronization error',
        reworkedEx,
        this.translate.instant('common.close')
      );
    }
  }

  private async continueImportAfterCreatedDID(
    didStore: DIDStore,
    storePassword: string,
    createdDID: DID
  ) {
    let identityEntries = await this.didSessions.getIdentityEntries();
    let duplicate = identityEntries.find(
      (identityEntry) => identityEntry.didString === createdDID.getDIDString()
    );
    Logger.log(
      'didsessions',
      'Checking all identities if import is already added',
      identityEntries,
      duplicate
    );

    if (!duplicate) {
      let profileName = createdDID.getNameCredentialValue();
      if (profileName) {
        Logger.log(
          'didsessions',
          'Name credential found in the DID. Using it.'
        );
        await this.finalizeIdentityCreation(
          didStore,
          storePassword,
          createdDID,
          profileName,
          true
        );
      } else {
        // No existing name credential found in the DID, so we need to ask user to give us one
        Logger.log(
          'didsessions',
          'No name credential found in the DID. Asking user to provide one.'
        );
        this.navigateWithCompletion(
          '/didsessions/editprofile',
          async ({ name, location }) => {
            // Add the name credential in the DID
            await createdDID.addNameCredential(name, storePassword);

            // Add the country credential in the DID
            await createdDID.addCountryCredential(location, storePassword);

            // Finalize
            await this.finalizeIdentityCreation(
              didStore,
              storePassword,
              createdDID,
              name,
              true,
              location
            );
          }
        );
      }
    } else {
      Logger.log('didsessions', 'New DID is already added');
      this.uxService.go('/didsessions/pickidentity');
      void this.alertDuplicateImport();
    }
  }

  /**
   * Cancels an on going DID creation or import and goes back to the root screen.
   */
  public async cancelIdentiyCreation(): Promise<void> {
    // TODO: Delete the "identityBeingCreated" first

    // Go back to DID sessions identity list or welcome screen
    await this.uxService.navigateRoot();
  }

  /**
   * Delete an identity
   */
  async deleteIdentity(identity: IdentityEntry): Promise<boolean> {
    Logger.log('didsessions', 'Deleting identity', identity);

    // Get did store password from the password manager
    try {
      // Prompt password
      /*   const passwordInfo = await passwordManager.getPasswordInfo("didstore-"+identity.didStoreId) as PasswordManagerPlugin.GenericPasswordInfo;
            if (!passwordInfo) {
                Logger.log('didsessions', "Unable to retrieve DID store password from password manager");
                return false;
            } */

      // Delete the did store, as for now, 1 DID = 1 DID store
      await this.deleteDIDStore(identity.didStoreId);

      // Delete entry from the did session plugin
      await this.didSessions.deleteIdentityEntry(identity.didString);

      // Delete all preferences
      await this.prefs.deletePreferences(identity.didString);

      // Delete all settings
      await this.storage.deleteDIDSettings(identity.didString);

      // Notify listeners of this deletion
      this.zone.run(() => {
        this.events.publish('identityremoved', identity);
      });

      return true;
    } catch (e) {
      let reworkedEx = DIDHelper.reworkedPluginException(e);
      if (
        reworkedEx instanceof PasswordManagerCancellationException ||
        reworkedEx instanceof WrongPasswordException ||
        reworkedEx instanceof BiometricAuthenticationFailedException ||
        reworkedEx instanceof BiometricLockedoutException
      ) {
        // Nothing to do, just stop the flow here.
      } else {
        throw e;
      }
    }
  }

  deleteDIDStore(didStoreId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Logger.log('didsessions', 'didManager', didManager);
      didManager.deleteDidStore(
        didStoreId,
        () => {
          resolve();
        },
        (err) => {
          Logger.error('didsessions', err);
          resolve();
        }
      );
    });
  }

  private async addIdentity(
    didStoreId: string,
    didString: string,
    name: string,
    avatar: CredentialAvatar,
    location?: string
  ): Promise<IdentityEntry> {
    /*
         // Special handler for the special "avatar" field
                    if (entry.key == "avatar") {
                        let avatar: Avatar = entry.value as Avatar;
                        Logger.log('didsessions', "Saving avatar info to signed in identity", avatar)

                        // For now we only know how to save base64 avatars. Other formats are unsupported
                        if (avatar.type === "base64") {
                            // Save this new avatar in the did session plugin.
                            let signedInEntry = await didSessionManager.getSignedInIdentity();
                            signedInEntry.avatar = {
                                contentType: avatar["content-type"],
                                base64ImageData: avatar.data
                            }
                            await didSessionManager.addIdentityEntry(signedInEntry);

                            // Let listeners know
                            DIDEvents.instance.events.publish("did:avatarchanged");
                        }
                    }
                    */

    let didStoragePath = await internalManager.getDidStoragePath(
      didStoreId,
      didString
    );

    let newIdentity: IdentityEntry = {
      didStoreId: didStoreId,
      didString: didString,
      name: name,
      country: location,
      didStoragePath: didStoragePath,
    };

    // Restore the avatar profile picture on the DID session manager, if any
    if (avatar) {
      Logger.log(
        'didsessions',
        'Found an avatar in the created DID. Now applying it to the DID session manager entry.',
        avatar
      );

      let hiveUrlAvatar =
        this.globalHiveService.getHiveAvatarUrlFromDIDAvatarCredential(avatar);

      // hive url that points to a script that provides the picture
      if (hiveUrlAvatar) {
        Logger.log('didsessions', 'Retrieve avatar from a hive url');
        let base64url =
          await this.globalHiveService.fetchHiveScriptPictureToDataUrl(
            hiveUrlAvatar
          );
        if (base64url) {
          Logger.log(
            'didsessions',
            "Got base64 url for user's avatar:",
            base64url
          );

          newIdentity.avatar = {
            base64ImageData: base64url.substring(base64url.indexOf(',') + 1),
            contentType: avatar['content-type'],
          };
        }
      }
      // base64 encoded picture inside the DID Document
      if (avatar.type && avatar.type == 'base64') {
        if (avatar.data && avatar['content-type']) {
          newIdentity.avatar = {
            base64ImageData: avatar.data,
            contentType: avatar['content-type'],
          };
        }
      } else {
        Logger.warn(
          'didsessions',
          'The avatar is not a known format. Skipping it.'
        );
      }
    }

    Logger.log(
      'didsessions',
      'Adding identity entry to DID session manager:',
      newIdentity
    );

    await this.didSessions.addIdentityEntry(newIdentity);

    this.zone.run(() => {
      this.events.publish('identityadded', newIdentity);
    });

    return newIdentity;
  }

  async loadGroupedIdentities(): Promise<IdentityGroup[]> {
    Logger.log('DIDSessions', 'Loading DID Session identities');

    let identityEntries = await this.didSessions.getIdentityEntries();
    //Logger.log('didsessions', identityEntries);

    let didStores: IdentityGroup[] = [];
    for (let idEntry of identityEntries) {
      let identityGroup: IdentityGroup = this.getIdentityGroupByStoreId(
        didStores,
        idEntry.didStoreId
      );
      let isDuplicate: boolean = this.checkForDuplicateId(
        didStores,
        idEntry.didString
      );

      // If identity group does not exist, create one
      if (!identityGroup) {
        identityGroup = {
          didStoreId: idEntry.didStoreId,
          entries: [],
        };
        // If didStores doesn't have DID, add it
        if (!isDuplicate) {
          didStores.push(identityGroup);
        }
      }

      identityGroup.entries.push(idEntry);
    }

    return Promise.resolve(didStores);
  }

  private getIdentityGroupByStoreId(
    didStores: IdentityGroup[],
    storeId: string
  ): IdentityGroup {
    return didStores.find((store) => store.didStoreId == storeId);
  }

  checkForDuplicateId(didStores: IdentityGroup[], id: string): boolean {
    let duplicate = didStores.find(
      (idGroup) => idGroup.entries[0].didString === id
    );
    if (duplicate) {
      Logger.log('didsessions', 'DID is already added', id);
      return true;
    } else {
      return false;
    }
  }

  private setMnemonicLangByLanguage(lang) {
    // Settings DID SDK language
    if (lang === 'zh') {
      this.setMnemonicLang('CHINESE_SIMPLIFIED');
    } else if (lang === 'fr') {
      this.setMnemonicLang('FRENCH');
    } else {
      this.setMnemonicLang('ENGLISH');
    }
  }

  public getMnemonicLang(): DIDPlugin.MnemonicLanguage {
    return this.mnemonicLang;
  }

  public setMnemonicLang(lang: DIDPlugin.MnemonicLanguage) {
    Logger.log('DIDSessions', 'Setting current mnemonic language to ' + lang);
    this.mnemonicLang = lang;
  }

  nextStepId = 0;
  private navigateWithCompletion(
    route: string,
    completionCb: stepCompletionCallback,
    enterEventData?: any
  ) {
    this.nextStepId++;

    let nextStep: NextStep = {
      id: this.nextStepId++,
      route: route,
      completionCb: completionCb,
    };
    this.nextSteps.push(nextStep);

    let enterEvent: NavigateWithCompletionEnterData = {
      stepId: nextStep.id,
      data: enterEventData,
    };

    this.uxService.go(route, {
      enterEvent: enterEvent,
    });
  }

  public async runNextStep(nextStepId: number, data?: any) {
    let nextStep = this.nextSteps.find((step) => step.id === nextStepId);
    if (nextStep) {
      Logger.log('didsessions', 'Running next step, route:', nextStep.route);
      await nextStep.completionCb(data);
    } else {
      Logger.log(
        'didsessions',
        "Can't run next step " + nextStepId + ', there is nothing after...'
      );
    }
  }

  public isSignedInIdentity(identityEntry: IdentityEntry): boolean {
    if (!this.signedIdentity) return false;

    return this.signedIdentity.didString == identityEntry.didString;
  }

  public async alertDuplicateImport() {
    const alert = await this.alertCtrl.create({
      mode: 'ios',
      header: this.translate.instant('didsessions.id-already-added'),
      message: this.translate.instant('didsessions.import-again'),
      buttons: [
        {
          text: this.translate.instant('didsessions.import-again-cancel'),
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: this.translate.instant('didsessions.import-again-yes'),
          handler: () => {
            void this.startImportingMnemonic(null);
          },
        },
      ],
    });

    await alert.present();
  }

  async createAPIPlayer(authToken: string, did: string, fullName: string) {
    console.log('authToken: ', authToken);
    console.log('DID: ', did);
    console.log('fullName: ', fullName);

    const param = {
      did: did,
      fullName: fullName,
    };
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      Authorization: `Bearer ${authToken}`,
    };

    let rpcApiUrl = environment.base_api_url;
    rpcApiUrl = rpcApiUrl.endsWith('/') ? rpcApiUrl.slice(0, -1) : rpcApiUrl;

    rpcApiUrl = `${rpcApiUrl}/players`;

    try {
      const result = await this.globalJsonRPCService.httpPost(
        rpcApiUrl,
        param,
        headers
      );
      Logger.log(App.DID_SESSIONS, 'Create API Player Result: ', result);
      return result;
    } catch (why: any) {
      Logger.log(App.DID_SESSIONS, 'error create api player:', why);
    }
    // if (result && !Util.isEmptyObject(result.producers)) {
    //     Logger.log(App.PSPROFILE, "key:", result.producers);
  }

  async createAPIAuthToken(did: string, password: string) {
    console.log('DID: ', did);
    console.log('Password: ', password);

    const param = {
      did: did,
      password: password,
    };
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      // Authorization: `Bearer ${environment.auth_token}`,
    };

    let rpcApiUrl = environment.base_api_url;
    rpcApiUrl = rpcApiUrl.endsWith('/') ? rpcApiUrl.slice(0, -1) : rpcApiUrl;

    rpcApiUrl = `${rpcApiUrl}/auth`;

    try {
      const result = await this.globalJsonRPCService.httpPost(
        rpcApiUrl,
        param,
        headers
      );
      Logger.log(App.DID_SESSIONS, 'Create API Auth Token Result: ', result);
      return result;
    } catch (why: any) {
      Logger.log(App.DID_SESSIONS, 'error create api auth token:', why);
    }
    // if (result && !Util.isEmptyObject(result.producers)) {
    //     Logger.log(App.PSPROFILE, "key:", result.producers);
  }

  async createAPIUser(did: string, password: string) {
    console.log('DID: ', did);
    console.log('Password: ', password);

    const param = {
      did: did,
      password: password,
      permissionLevel: 2,
    };
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      // Authorization: `Bearer ${environment.auth_token}`,
    };

    let rpcApiUrl = environment.base_api_url;
    rpcApiUrl = rpcApiUrl.endsWith('/') ? rpcApiUrl.slice(0, -1) : rpcApiUrl;

    rpcApiUrl = `${rpcApiUrl}/users`;

    try {
      const result = await this.globalJsonRPCService.httpPost(
        rpcApiUrl,
        param,
        headers
      );
      Logger.log(App.DID_SESSIONS, 'Create API User Result: ', result);
      return result;
    } catch (why: any) {
      Logger.log(App.DID_SESSIONS, 'error create api user:', why);
    }
    // if (result && !Util.isEmptyObject(result.producers)) {
    //     Logger.log(App.PSPROFILE, "key:", result.producers);
  }
}
