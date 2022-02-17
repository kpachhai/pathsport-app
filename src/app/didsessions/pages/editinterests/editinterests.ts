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
import { environment } from 'src/environments/environment';

// Imports start for country picker
import { Native } from '../../../identity/services/native';
import { Events } from 'src/app/services/events.service';
import { GlobalStorageService } from 'src/app/services/global.storage.service';
import {
  Direction,
  GlobalNavService,
} from 'src/app/services/global.nav.service';

import { App } from 'src/app/model/app.enum';
import { GlobalJsonRPCService } from 'src/app/services/global.jsonrpc.service';
import { DidService } from 'src/app/psprofile/services/did.service';
// Imports end for country picker

export type EditInterestsStateParams = {
  onCompletion: Promise<string>;
};

@Component({
  selector: 'page-editinterests',
  templateUrl: 'editinterests.html',
  styleUrls: ['editinterests.scss'],
})
export class EditInterestsPage {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild('input', { static: false }) input: IonInput;
  @ViewChild(IonSlides, { static: false }) private slide: IonSlides;

  // public slideIndex = null;
  // private nextStepId: number = null;
  public isEdit: boolean = false;
  // public sportsType: string = '';
  // public interests: Boolean[] = [];
  public interests: any = [];

  private titleBarIconClickedListener: (
    icon: TitleBarIcon | TitleBarMenuItem
  ) => void;

  constructor(
    private uxService: UXService,
    public didService: DidService,
    private globalNavService: GlobalNavService,
    private storage: GlobalStorageService,
    private globalJsonRPCService: GlobalJsonRPCService,
    public theme: GlobalThemeService,
    private translate: TranslateService,
    private identityService: IdentityService,
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
    this.titleBar.setTitle(
      this.translate.instant('didsessions.edit-interests')
    );
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

  async selectInterests(interest) {
    //onclick of an interest should check if the class is active or inactive
    //add to interests array on active and remove on inactive

    console.log('Selected Interest: ', interest);

    // let existing = this.interests.filter((i) => i.sport === interest);

    // this.interests.push({
    //   sport: interest,
    //   selected: this.interests.filter(
    //     (i) => i.sport === interest && i.selected === true
    //   ).length
    //     ? false
    //     : true,
    // });
    /*
    if (!existing.length) {
      this.interests.push({
        sport: interest,
        selected: true,
      });
    } else {
      this.interests = this.interests.map((item, index) => {
        if (item.sport === interest) {
          item.selected = !item.selected;
        }
        return item;
      });
    }
*/
    this.interests[interest] = this.interests[interest] ? false : true;
    console.log('Interests List: ', this.interests);
  }

  async saveInterests() {
    let dbInterests = [];
    const interestArray = [
      'real_madrid',
      'barcelona',
      'manchester_united',
      'juventus',
      'chelsea',
      'ronaldo',
      'messi',
      'neymar',
      'dybala',
    ];

    for (let i = 0; i < interestArray.length; i++) {
      if (this.interests[interestArray[i]]) {
        dbInterests.push(interestArray[i]);
      }
    }
    console.log('Save interests: ', dbInterests);
    console.log('saving interests...');

    const _did = 'did:elastos:ipsGDumwoBti6iwPF8rWHqFg2ishQ9yHdH'; //this.didService.getSignedIdentity();
    const _authToken = await this.storage.getSetting(
      _did,
      'didsession',
      '_accessToken',
      ''
    );
    console.log('DID: ', _did);
    console.log('Access Token: ', _authToken);
    console.log('Interests: ', dbInterests);

    const param = {
      did: _did,
      interests: dbInterests,
    };
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      Authorization: `Bearer ${_authToken}`,
    };

    let rpcApiUrl = environment.base_api_url;
    rpcApiUrl = rpcApiUrl.endsWith('/') ? rpcApiUrl.slice(0, -1) : rpcApiUrl;

    rpcApiUrl = `${rpcApiUrl}/players/${_did}`;

    try {
      const result = await this.globalJsonRPCService.httpPatch(
        rpcApiUrl,
        param,
        headers
      );
      console.log('Update Interests Result: ', result);

      let props: any = {
        queryParams: {
          interests: dbInterests,
        },
        animationDirection: Direction.BACK,
      };

      this.navigateToNextScreen();

      // void this.globalNavService.navigateRoot(
      //   App.PSPROFILE,
      //   '/psprofile/friends',
      //   props
      // );
    } catch (why: any) {
      Logger.log(App.DID_SESSIONS, 'error update interests:', why);
    }
  }

  async navigateToNextScreen() {
    this.identityService.navigateEditAvatar();
  }
}
