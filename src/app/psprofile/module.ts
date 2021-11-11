import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';
import { QRCodeModule } from 'angularx-qrcode';
import { IonicModule } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage';
import { Clipboard } from '@ionic-native/clipboard/ngx';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { PSProfileRoutingModule } from './routing';
import { OptionsComponent } from './components/options/options.component';
import { DeleteComponent } from './components/delete/delete.component';
import { QRCodeComponent } from './components/qrcode/qrcode.component';
import { PictureComponent } from './components/picture/picture.component';
import { ComponentsModule } from './components/components.module';
import { SharedComponentsModule } from '../components/sharedcomponents.module';
import { AddPage } from './pages/add/add.page';
import { ConfirmPage } from './pages/confirm/confirm.page';
import { CustomizePage } from './pages/customize/customize.page';
// import { FriendDetailsPage } from './pages/friend-details/friend-details.page';
import { FriendsPage } from './pages/friends/friends.page';
import { InvitePage } from './pages/invite/invite.page';

import { EditSummaryPage } from './pages/edit-summary/edit-summary.page';
import { EditPersonalInformationPage } from './pages/edit-personal-information/edit-personal-information.page';
import { EditSocialProfilesPage } from './pages/edit-social-profiles/edit-social-profiles.page';
import { EditProfessionalHighlightsPage } from './pages/edit-professional-highlights/edit-professional-highlights.page';
import { AddStatsPage } from './pages/add-stats/add-stats.page';

@NgModule({
  declarations: [
    OptionsComponent,
    DeleteComponent,
    QRCodeComponent,
    PictureComponent,
    AddPage,
    ConfirmPage,
    CustomizePage,
    // FriendDetailsPage,
    FriendsPage,
    InvitePage,
    EditSummaryPage,
    EditPersonalInformationPage,
    EditSocialProfilesPage,
    EditProfessionalHighlightsPage,
    AddStatsPage,
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    IonicModule,
    PSProfileRoutingModule,
    QRCodeModule,
    ComponentsModule,
    SharedComponentsModule,
    FormsModule,
    IonicStorageModule.forRoot(),
    TranslateModule,
  ],
  bootstrap: [],
  entryComponents: [
    OptionsComponent,
    DeleteComponent,
    QRCodeComponent,
    PictureComponent,
  ],
  providers: [Clipboard],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PSProfileModule {}
