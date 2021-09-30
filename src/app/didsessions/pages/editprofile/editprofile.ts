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
// Imports end for country picker

export type EditProfileStateParams = {
  onCompletion: Promise<string>;
};

@Component({
  selector: 'page-editprofile',
  templateUrl: 'editprofile.html',
  styleUrls: ['editprofile.scss'],
})
export class EditProfilePage {
  @ViewChild(TitleBarComponent, { static: true }) titleBar: TitleBarComponent;
  @ViewChild('input', { static: false }) input: IonInput;
  @ViewChild(IonSlides, { static: false }) private slide: IonSlides;

  public slideIndex = null;
  private nextStepId: number = null;
  public isEdit: boolean = false;
  public name: string = ''; // Name being edited
  public location: string = ''; // Location being edited
  public locationAlpha3: string = '';
  public sportsType: string = '';
  private selectCountrySubscription: Subscription = null;
  private showSelectCountry = false;

  public creatingDid = false;

  private titleBarIconClickedListener: (
    icon: TitleBarIcon | TitleBarMenuItem
  ) => void;

  constructor(
    private uxService: UXService,
    public theme: GlobalThemeService,
    private translate: TranslateService,
    private identityService: IdentityService,
    private native: Native,
    public events: Events,
    public zone: NgZone,
    private router: Router
  ) {
    const navigation = this.router.getCurrentNavigation();
    if (navigation.extras.state) {
      this.nextStepId = navigation.extras.state.enterEvent.stepId;
      Logger.log('didsessions', 'Editprofile - nextStepId', this.nextStepId);
    }
  }

  ngOnInit() {}

  ionViewWillEnter() {
    this.titleBar.setTitle(this.translate.instant('didsessions.identity-name'));
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

  async next() {
    this.creatingDid = true;
    if (this.checkParams()) {
      await this.identityService.runNextStep(this.nextStepId, {
        name: this.name,
        location: this.location,
      });
    }
    this.creatingDid = false;
  }

  checkParams() {
    if (!this.name || this.name == '') {
      this.uxService.toast_trans('common.name-is-missing');
      return false;
    }

    if (!this.location || this.location == '') {
      this.uxService.toast_trans('common.location-is-missing');
      return false;
    }

    if (!this.sportsType || this.sportsType == '') {
      this.uxService.toast_trans('common.sports-type-is-missing');
      return false;
    }

    return true;
  }

  /********** For 'nation' entry **********/
  // async selectCountry(countryEntry: BasicCredentialEntry) {
  async selectCountry() {
    // Logger.log('Identity', 'CountryEntry: ' + countryEntry.key);
    this.selectCountrySubscription = this.events.subscribe(
      'selectarea',
      (params: CountryCodeInfo) => {
        Logger.log('Identity', 'Country selected: ' + params.alpha3);
        this.zone.run(() => {
          this.location = params.name;
          this.locationAlpha3 = params.alpha3;
          this.showSelectCountry = false;
        });
        this.selectCountrySubscription.unsubscribe();
      }
    );
    await this.native.go('/identity/countrypicker');
    this.showSelectCountry = true;
  }

  getDisplayableNation(countryAlpha3) {
    let countryInfo = area.find((a: CountryCodeInfo) => {
      return countryAlpha3 == a.alpha3;
    });

    if (!countryInfo) return null;

    return countryInfo.name;
  }

  async selectSports(event) {
    this.slideIndex = await this.slide.getActiveIndex();
    console.log('Sports type slide index: ', this.slideIndex);
    console.log(event);

    if (this.slideIndex === 0) {
      this.sportsType = 'Football';
    } else if (this.slideIndex === 1) {
      this.sportsType = 'Basketball';
    }
  }
}
