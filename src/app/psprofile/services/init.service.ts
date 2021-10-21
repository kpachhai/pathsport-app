import { Injectable } from '@angular/core';
import {
  GlobalDIDSessionsService,
  IdentityEntry,
} from 'src/app/services/global.didsessions.service';
import {
  GlobalService,
  GlobalServiceManager,
} from 'src/app/services/global.service.manager';
import { GlobalNavService } from 'src/app/services/global.nav.service';
import { AppService } from '../services/app.service';
import { BackupService } from '../services/backup.service';
import { IntentService } from '../services/intent.service';
import { FriendsService } from './friends.service';

@Injectable({
  providedIn: 'root',
})
export class PSProfileInitService extends GlobalService {
  constructor(
    private appService: AppService,
    private intentService: IntentService,
    private friendsService: FriendsService,
    private backupService: BackupService,
    private didSessions: GlobalDIDSessionsService,
    private globalNav: GlobalNavService
  ) {
    super();
  }

  public init(): Promise<void> {
    GlobalServiceManager.getInstance().registerService(this);
    return;
  }

  public async onUserSignIn(signedInIdentity: IdentityEntry): Promise<void> {
    await this.friendsService.init();
    // Make sure to call intent service after friends services because contacts must be
    // initialized before handling any intent that would modify contacts.
    this.intentService.init();
  }

  public onUserSignOut(): Promise<void> {
    this.intentService.stop();
    return;
  }

  public async start() {
    console.log('PSProfile service started');

    await this.globalNav.navigateTo('psprofile', '/psprofile/friends');
    // void this.backupService.init();
  }
}
