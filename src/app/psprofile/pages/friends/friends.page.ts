import { Component, OnInit, ViewChild, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { IonSlides } from '@ionic/angular';

import { FriendsService } from '../../services/friends.service';
import { DidService } from '../../services/did.service';
import { DIDService as IdentityDidService } from '../../../identity/services/did.service';
import { UxService } from '../../services/ux.service';

import { ProfileService } from '../../../identity/services/profile.service';
import { Contact } from '../../models/contact.model';
import { PopupService } from '../../services/popup.service';
import { AppService } from '../../services/app.service';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { GlobalThemeService } from 'src/app/services/global.theme.service';
import {
  TitleBarIconSlot,
  BuiltInIcon,
  TitleBarIcon,
  TitleBarMenuItem,
} from 'src/app/components/titlebar/titlebar.types';
import { GlobalNavService } from 'src/app/services/global.nav.service';
import { Logger } from 'src/app/logger';
import { Events } from 'src/app/services/events.service';
import { defaultContacts } from '../../config/config';
import { App } from 'src/app/model/app.enum';
import { environment } from 'src/environments/environment';
import { GlobalJsonRPCService } from 'src/app/services/global.jsonrpc.service';
import { Profile } from 'src/app/identity/model/profile.model';
import { NavigationExtras } from '@angular/router';
import { GlobalStorageService } from 'src/app/services/global.storage.service';

@Component({
  selector: 'app-friends',
  templateUrl: './friends.page.html',
  styleUrls: ['./friends.page.scss'],
})
export class FriendsPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: false }) titleBar: TitleBarComponent;
  @ViewChild('slider', { static: false }) slider: IonSlides;

  public favActive = false;
  private subscription: Subscription = null;
  private titleBarIconClickedListener: (
    icon: TitleBarIcon | TitleBarMenuItem
  ) => void;

  slideOpts = {
    initialSlide: 0,
    speed: 200,
    zoom: true,
    centeredSlides: true,
    slidesPerView: 3.5,
  };

  public profile: Profile;
  public profileName: string = null;

  public sport: string = null;
  public club: string = null;
  public team: string = null;
  public position: string = null;

  public jerseyName: string = null;
  public height: string = null;
  public weight: string = null;
  public dob: string = null;
  public location: string = null;

  public summary: string = null;

  public statistics: any = null;
  public games: number = 0;
  public goals: number = 0;
  public average: number = 0;

  public instagram: string = null;
  public facebook: string = null;
  public twitter: string = null;
  public fifa: string = null;
  public nba: string = null;

  public match: string = null;
  public football: string = null;
  public basketball: string = null;

  private didchangedSubscription: Subscription = null;

  public psprofile: any;

  constructor(
    public friendsService: FriendsService,
    public didService: DidService,
    public identityDidService: IdentityDidService,
    public translate: TranslateService,
    public theme: GlobalThemeService,
    public popupService: PopupService,
    public appService: AppService,
    public uxService: UxService,
    private zone: NgZone,
    private events: Events,
    private globalNav: GlobalNavService,
    private globalJsonRPCService: GlobalJsonRPCService,
    public profileService: ProfileService,
    private route: ActivatedRoute,
    private storage: GlobalStorageService
  ) {
    // this.getProfile();
  }

  // ngOnInit() {
  async ngOnInit() {
    this.init();

    this.route.queryParams.subscribe((params) => {
      // console.log('Personal info pageee: ', params);

      this.match = '';
      this.football = '';
      this.basketball = '';

      // Update Summary if navigating back from edit page
      if (params['summary']) {
        this.summary = params['summary'];
      }

      // Update Personal Information if navigating back from edit page
      if (params['fullName']) {
        this.profileName = params['fullName'];
      }
      if (params['jerseyName']) {
        this.jerseyName = params['jerseyName'];
      }
      if (params['height']) {
        this.height = params['height'];
      }
      if (params['weight']) {
        this.weight = params['weight'];
      }
      if (params['dob']) {
        this.dob = params['dob'];
      }
      if (params['location']) {
        this.location = params['location'];
      }

      // Update Professional Highlights if navigating back from edit page
      if (params['sport']) {
        this.sport = params['sport'];
      }
      if (params['club']) {
        this.club = params['club'];
      }
      if (params['team']) {
        this.team = params['team'];
      }
      if (params['position']) {
        this.position = params['position'];
      }

      // Update Social Profiles if navigating back from edit page
      if (params['instagram']) {
        this.instagram = params['instagram'];
      }
      if (params['facebook']) {
        this.facebook = params['facebook'];
      }
      if (params['twitter']) {
        this.twitter = params['twitter'];
      }
      if (params['fifa']) {
        this.fifa = params['fifa'];
      }
      if (params['nba']) {
        this.nba = params['nba'];
      }

      // Update Stats if navigating back from add page
      if (params['match']) {
        this.match = params['match'];
      }

      if (params['football']) {
        this.football = params['football'];
      }

      if (params['basketball']) {
        this.basketball = params['basketball'];
      }

      // upon navigating from add-stats page, append new stats to statistics json
      if (this.match && (this.football || this.basketball)) {
        const newlyAddedMatch = {
          match: JSON.parse(this.match),
          football: JSON.parse(this.football),
        };

        this.statistics.push(newlyAddedMatch);

        this.games = this.statistics.length;
        this.goals = this.statistics
          .map((s: any) => s.football.total_goals)
          .reduce((prevVal: number, currVal: number) => prevVal + currVal);
        this.average = this.goals / this.games;
      }

      // Logger.log('psprofile', 'PSprofile edit professional highlights');
    });
  }

  async init(publishAvatar?: boolean) {
    this.psprofile = await this.getPSProfile();
    console.log('Profile data nginit: ', this.psprofile);

    if (this.psprofile) {
      this.sport = this.psprofile.sport;
      this.team = this.psprofile.team;
      this.club = this.psprofile.club;
      this.position = this.psprofile.position;

      this.jerseyName = this.psprofile.jerseyName;
      this.height = this.psprofile.height;
      this.weight = this.psprofile.weight;
      if (this.psprofile.birth && this.psprofile.birth.date) {
        this.dob = this.psprofile.birth.date;
      }
      this.location = this.psprofile.location;

      this.summary = this.psprofile.summary;
      this.statistics = this.psprofile.statistics;
      this.games = this.statistics.length;
      this.goals = this.statistics
        .map((s: any) => s.football.total_goals)
        .reduce((prevVal: number, currVal: number) => prevVal + currVal);
      this.average = this.goals / this.games;

      if (this.psprofile.social && this.psprofile.social.instagram) {
        this.instagram = this.psprofile.social.instagram;
      }
      if (this.psprofile.social && this.psprofile.social.facebook) {
        this.facebook = this.psprofile.social.facebook;
      }
      if (this.psprofile.social && this.psprofile.social.twitter) {
        this.twitter = this.psprofile.social.twitter;
      }
      if (this.psprofile.social && this.psprofile.social.fifa) {
        this.fifa = this.psprofile.social.fifa;
      }
      if (this.psprofile.social && this.psprofile.social.nba) {
        this.nba = this.psprofile.social.nba;
      }
    }

    let identity = this.identityDidService.getActiveDid();
    console.log('Identity: ', identity);

    if (identity) {
      // Happens when importing a new mnemonic over an existing one
      // this.profile = identity.getBasicProfile();
      // this.profileName = this.profile.getName();
      this.profileName = this.getProfileName();
      console.log('Profile Name: ', this.profileName);
    }
  }

  ionViewWillEnter() {
    // this.subscription = this.events.subscribe(
    //   'psprofile:updateProfileData',
    //   () => {
    //     this.zone.run(() => {
    //       Logger.log('psprofile', 'psprofile:updateProfileData event');
    //     });
    //   }
    // );

    this.didchangedSubscription = this.events.subscribe(
      'did:didchanged',
      () => {
        this.zone.run(() => {
          this.init();
        });
      }
    );

    this.titleBar.setTitle(this.translate.instant('common.psprofile'));
    // this.titleBar.setIcon(TitleBarIconSlot.OUTER_RIGHT, {
    //   key: 'add',
    //   iconPath: BuiltInIcon.ADD,
    // });

    this.titleBarIconClickedListener = (clickedIcon) => {
      this.appService.onTitleBarItemClicked(clickedIcon);
    };
    this.titleBar.addOnItemClickedListener(this.titleBarIconClickedListener);

    // void this.getContacts();
    // this.profile = this.getProfile();
    // console.log('Profile data ionviwewillenter: ', this.profile);
  }

  ionViewWillLeave() {
    // this.subscription.unsubscribe();
    this.didchangedSubscription.unsubscribe();
    this.titleBar.removeOnItemClickedListener(this.titleBarIconClickedListener);
  }

  changeList(activateFav: boolean) {
    this.zone.run(() => {
      this.favActive = activateFav;
    });
  }

  getFavorites(): Contact[] {
    return this.friendsService.contacts.filter((contact) => contact.isFav);
  }

  async getContacts() {
    Logger.log('contacts', 'Initializing home - "friends" pg');
    await this.getActiveSlide();
  }

  async getActiveSlide() {
    if (this.friendsService.contacts.length) {
      const index = await this.slider.getActiveIndex();
      this.friendsService.activeSlide =
        this.friendsService.contacts[index] ||
        this.friendsService.contacts[this.friendsService.contacts.length - 1];
      Logger.log(
        'contacts',
        'friends.getActiveSlide - ',
        this.friendsService.activeSlide
      );
    } else {
      Logger.log('contacts', 'friends.getActiveSlide - No contacts');
    }
  }

  // Reveal 'First Contact' Intro if user's list of contacts exactly matches the default
  // contacts list.
  shouldShowFirstContactInformation(): boolean {
    // Different list size means different content.
    if (this.friendsService.contacts.length != defaultContacts.length)
      return false;

    for (let userContact of this.friendsService.contacts) {
      if (!defaultContacts.find((c) => c === userContact.id)) return false;
    }

    return true;
  }

  /*
  goToContact(contact: Contact) {
    void this.globalNav.navigateTo(
      'contacts',
      '/psprofile/friends/' + contact.id
    );
  }*/

  goToEditSummary() {
    let props: NavigationExtras = {
      queryParams: {
        summary: this.summary,
      },
    };

    console.log('goToEditSummary: ', this.summary);

    void this.globalNav.navigateTo(
      'psprofile',
      '/psprofile/edit-summary',
      props
    );
  }

  goToEditPersonalInformation() {
    let props: NavigationExtras = {
      queryParams: {
        fullName: this.profileName,
        jerseyName: this.jerseyName,
        height: this.height,
        weight: this.weight,
        dob: this.dob,
        location: this.location,
      },
    };

    void this.globalNav.navigateTo(
      'psprofile',
      '/psprofile/edit-personal-information',
      props
    );
  }

  goToEditProfessionalHighlights() {
    let props: NavigationExtras = {
      queryParams: {
        sport: this.sport,
        club: this.club,
        team: this.team,
        position: this.position,
      },
    };

    void this.globalNav.navigateTo(
      'psprofile',
      '/psprofile/edit-professional-highlights',
      props
    );
  }

  goToAddStats() {
    void this.globalNav.navigateTo('psprofile', '/psprofile/add-stats');
  }

  goToEditSocialProfiles() {
    let props: NavigationExtras = {
      queryParams: {
        instagram: this.instagram,
        facebook: this.facebook,
        twitter: this.twitter,
        fifa: this.fifa,
        nba: this.nba,
      },
    };

    void this.globalNav.navigateTo(
      'psprofile',
      '/psprofile/edit-social-profiles',
      props
    );
  }

  async getPSProfile() {
    const _did = this.didService.getSignedIdentity();
    const _authToken = await this.storage.getSetting(
      _did,
      'didsession',
      '_accessToken',
      ''
    );
    console.log('DID: ', _did);
    console.log('Access Token: ', _authToken);

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      Authorization: `Bearer ${_authToken}`,
    };

    let rpcApiUrl = environment.base_api_url;
    rpcApiUrl = rpcApiUrl.endsWith('/') ? rpcApiUrl.slice(0, -1) : rpcApiUrl;

    rpcApiUrl = `${rpcApiUrl}/players/${_did}`;

    try {
      const result = await this.globalJsonRPCService.httpGet(
        rpcApiUrl,
        headers
      );
      // this.profile = result;
      console.log('Get Summary Result: ', result);
      return result;
    } catch (why: any) {
      Logger.log(App.PSPROFILE, 'error get summary:', why);
    }
    // if (result && !Util.isEmptyObject(result.producers)) {
    //     Logger.log(App.PSPROFILE, "key:", result.producers);
  }

  getProfileName() {
    if (this.profileName == null) {
      let identity = this.identityDidService.getActiveDid();
      if (identity) {
        // Happens when importing a new mnemonic over an existing one
        this.profile = this.profileService.getBasicProfile();
      }
      this.profileName = this.profile.getName();
    }
    return this.profileName;
  }
}
