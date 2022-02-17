import { Component, NgZone, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonInput, IonSlides } from '@ionic/angular';
import { UXService } from 'src/app/didsessions/services/ux.service';
import { TranslateService } from '@ngx-translate/core';
import { IdentityService } from 'src/app/didsessions/services/identity.service';
import { GlobalThemeService } from 'src/app/services/global.theme.service';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import {
  TitleBarIconSlot,
  BuiltInIcon,
  TitleBarIcon,
  TitleBarMenuItem,
} from 'src/app/components/titlebar/titlebar.types';
import { Logger } from 'src/app/logger';

// Imports start for country picker
import { Native } from '../../../identity/services/native';
import { area } from '../../../../assets/identity/area/area';
import { BasicCredentialEntry } from '../../../identity/model/basiccredentialentry.model';
import { CountryCodeInfo } from '../../../identity/model/countrycodeinfo';
import { Subscription } from 'rxjs';
import { Events } from 'src/app/services/events.service';
import { GlobalDIDSessionsService } from 'src/app/services/global.didsessions.service';
// Imports end for country picker

export type EditAvatarStateParams = {
  onCompletion: Promise<string>;
};

@Component({
  selector: 'page-editavatar',
  templateUrl: 'editavatar.html',
  styleUrls: ['editavatar.scss'],
})
export class EditAvatarPage {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild('input', { static: false }) input: IonInput;
  @ViewChild(IonSlides, { static: false }) private slide: IonSlides;

  // public slideIndex = null;
  // private nextStepId: number = null;
  public isEdit: boolean = false;
  // public sportsType: string = '';
  public avatar: string = '';

  private titleBarIconClickedListener: (
    icon: TitleBarIcon | TitleBarMenuItem
  ) => void;

  constructor(
    private uxService: UXService,
    public theme: GlobalThemeService,
    private translate: TranslateService,
    private identityService: IdentityService,
    private didSessions: GlobalDIDSessionsService,
    private native: Native,
    public events: Events,
    public zone: NgZone,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    // if (navigation.extras.state) {
    //   this.nextStepId = navigation.extras.state.enterEvent.stepId;
    //   Logger.log('didsessions', 'Editinterests - nextStepId', this.nextStepId);
    // }
  }

  ngOnInit() {}

  ionViewWillEnter() {
    // this.titleBar.setTitle('Edit Interests');
    this.titleBar.setTitle(this.translate.instant('didsessions.edit-avatar'));
    this.titleBar.setIcon(TitleBarIconSlot.OUTER_LEFT, {
      key: 'back',
      iconPath: BuiltInIcon.BACK,
    });
    this.titleBar.setIcon(TitleBarIconSlot.OUTER_RIGHT, {
      key: 'language',
      iconPath: BuiltInIcon.EDIT,
    });
    this.titleBar.setNavigationMode(null);
    this.titleBar.addOnItemClickedListener(
      (this.titleBarIconClickedListener = (icon) => {
        this.uxService.onTitleBarItemClicked(icon);
      })
    );
  }

  // ionViewDidEnter() {
  //   setTimeout(() => {
  //     this.input.setFocus();
  //   }, 200);
  // }

  ionViewWillLeave() {
    this.titleBar.removeOnItemClickedListener(this.titleBarIconClickedListener);
  }

  /*
  async next() {
    this.creatingDid = true;
    if (this.checkParams()) {
      await this.identityService.runNextStep(this.nextStepId, {
        name: this.name,
        location: this.location,
      });
    }
    this.creatingDid = false;
  }*/

  /*
  checkParams() {
    if (!this.sportsType || this.sportsType == '') {
      this.uxService.toast_trans('common.sports-type-is-missing');
      return false;
    }

    return true;
  }
  */

  async selectAvatar(avatar) {
    //onclick of an avatar should check if the class is active or inactive
    console.log('Selected Avatar: ', avatar);
    this.avatar = avatar;
  }

  async saveAvatar() {
    this.navigateToNextScreen();
  }

  async navigateToNextScreen() {
    void this.didSessions.navigateHome();
  }
}
