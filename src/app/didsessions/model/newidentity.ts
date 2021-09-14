import { IdentityEntry } from 'src/app/services/global.didsessions.service';
import { DID } from './did.model';
import { DIDStore } from './didstore.model';

export class NewIdentity {
  didSessionsEntry: IdentityEntry = null;
  didStore: DIDStore = null;
  storePass: string = null;
  did: DID = null;
  name: string;
  country?: string;
  mnemonic: string;
  mnemonicLanguage?: DIDPlugin.MnemonicLanguage = null;
  mnemonicPassphrase?: string = null;
}
