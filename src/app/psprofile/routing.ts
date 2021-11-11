import { Component, NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
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

const routes: Routes = [
  { path: 'friends', component: FriendsPage },
  { path: 'add', component: AddPage },
  { path: 'confirm', component: ConfirmPage },
  { path: 'customize', component: CustomizePage },
  { path: 'invite', component: InvitePage },
  // { path: 'friends/:friendId', component: FriendDetailsPage },
  { path: 'edit-personal-information', component: EditPersonalInformationPage },
  { path: 'edit-summary', component: EditSummaryPage },
  { path: 'edit-social-profiles', component: EditSocialProfilesPage },
  {
    path: 'edit-professional-highlights',
    component: EditProfessionalHighlightsPage,
  },
  { path: 'add-stats', component: AddStatsPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PSProfileRoutingModule {}
