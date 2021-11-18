import { Component, OnInit, NgZone, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'src/environments/environment';
import { Clipboard } from '@ionic-native/clipboard/ngx';

// import * as moment from 'moment';

// import { FriendsService } from '../../services/friends.service';
import { NativeService } from '../../services/native.service';
import { UxService } from '../../services/ux.service';
import { DidService } from '../../services/did.service';
import { AppService } from '../../services/app.service';
import { PopupService } from '../../services/popup.service';
import { GlobalJsonRPCService } from 'src/app/services/global.jsonrpc.service';

// import { Contact } from '../../models/contact.model';
import { DApp } from '../../models/dapp.model';
import { TitleBarComponent } from 'src/app/components/titlebar/titlebar.component';
import { GlobalThemeService } from 'src/app/services/global.theme.service';
import {
  TitleBarIconSlot,
  BuiltInIcon,
  TitleBarNavigationMode,
  TitleBarIcon,
  TitleBarMenuItem,
} from 'src/app/components/titlebar/titlebar.types';
import { GlobalIntentService } from 'src/app/services/global.intent.service';
import { Logger } from 'src/app/logger';
import {
  Direction,
  GlobalNavService,
} from 'src/app/services/global.nav.service';
import { partitionArray } from '@angular/compiler/src/util';
import { App } from 'src/app/model/app.enum';

type DisplayableAppInfo = {
  packageId: string;
  app: DApp;
  action: string;
  isInstalled: boolean;
};

@Component({
  selector: 'app-edit-personal-information',
  templateUrl: './edit-personal-information.page.html',
  styleUrls: ['./edit-personal-information.page.scss'],
})
export class EditPersonalInformationPage implements OnInit {
  @ViewChild(TitleBarComponent, { static: false }) titleBar: TitleBarComponent;

  // public contact: Contact;
  //public contactsApps: DisplayableAppInfo[] = [];
  public fetchingApps = false;
  public detailsActive = true;
  public fullName: string = ''; // fullName being edited
  public jerseyName: string = ''; // jerseyName being edited
  public height: string = ''; // height being edited
  public weight: string = ''; // weight being edited
  public dob: any = new Date(); // dob being edited
  public location: string = ''; // location being edited

  private titleBarIconClickedListener: (
    icon: TitleBarIcon | TitleBarMenuItem
  ) => void;

  constructor(
    // public friendsService: FriendsService,
    public uxService: UxService,
    public didService: DidService,
    public appService: AppService,
    public popupService: PopupService,
    private native: NativeService,
    private route: ActivatedRoute,
    private zone: NgZone,
    private http: HttpClient,
    public translate: TranslateService,
    public theme: GlobalThemeService,
    private clipboard: Clipboard,
    private globalNavService: GlobalNavService,
    private globalJsonRPCService: GlobalJsonRPCService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      console.log('Personal info pageee: ', params);

      this.fullName = params['fullName'] ? params['fullName'] : '';
      this.jerseyName = params['jerseyName'] ? params['jerseyName'] : '';
      this.height = params['height'] ? params['height'] : '';
      this.weight = params['weight'] ? params['weight'] : '';
      this.dob = params['dob'] ? params['dob'] : '';
      this.location = params['location'] ? params['location'] : '';

      // if (!paramMap.has('friendId')) {
      // void this.globalNavService.navigateRoot(
      //   'psprofile',
      //   '/psprofile/friends'
      // );
      // return;
      // }
      /*
      const targetContact = this.friendsService.getContact(
        paramMap.get('friendId')
      );
      this.friendsService.contacts.map((contact) => {
        if (contact.id === targetContact.id) {
          this.contact = contact;
        }
      });
*/
      Logger.log('psprofile', 'PSprofile edit personal information');
      //this.buildDisplayableAppsInfo();
    });
  }

  ionViewWillEnter() {
    console.log('Edit personal information page ionViewWillEnter');

    this.titleBar.setTitle(
      this.translate.instant('psprofile.psprofile-profile')
    );
    this.titleBar.setIcon(TitleBarIconSlot.OUTER_RIGHT, null);
    this.titleBar.setNavigationMode(TitleBarNavigationMode.CUSTOM, {
      key: 'backToHome',
      iconPath: BuiltInIcon.BACK,
    });
    this.titleBar.addOnItemClickedListener(
      (this.titleBarIconClickedListener = (icon) => {
        this.appService.onTitleBarItemClicked(icon);
      })
    );

    // this.testApi();
    // this.getSummary();
  }

  ionViewWillLeave() {
    this.titleBar.removeOnItemClickedListener(this.titleBarIconClickedListener);
  }

  /*
  changeList(activateDetails: boolean) {
    this.zone.run(() => {
      this.detailsActive = activateDetails;
    });
  }

  fixBirthDate(birth) {
    return moment(birth).format('MMMM Do YYYY');
  }

  copyAddress(type: string, address: string) {
    void this.clipboard.copy(address);
    void this.native.genericToast(
      this.translate.instant(type) +
        this.translate.instant('contacts.copied-with-type')
    );
  }
  */

  // async testApi() {
  //   let rpcApiUrl = environment.base_api_url;

  //   try {
  //     const result = await this.globalJsonRPCService.httpGet(rpcApiUrl);
  //     console.log('Test API Result: ');
  //   } catch (why: any) {
  //     Logger.log(App.PSPROFILE, 'error test api', why);
  //   }
  // }

  // async getSummary() {
  //   console.log('DID: ', this.didService.getUserDID());

  //   const headers = {
  //     'Content-Type': 'application/json',
  //     Authorization: `Bearer ${environment.auth_token}`,
  //   };

  //   let rpcApiUrl = environment.base_api_url;
  //   rpcApiUrl = rpcApiUrl.endsWith('/') ? rpcApiUrl.slice(0, -1) : rpcApiUrl;

  //   rpcApiUrl = `${rpcApiUrl}/players/${this.didService.getUserDID()}`;

  //   try {
  //     const result = await this.globalJsonRPCService.httpGet(
  //       rpcApiUrl,
  //       headers
  //     );
  //     console.log('Get Summary Result: ', result);
  //   } catch (why: any) {
  //     Logger.log(App.PSPROFILE, 'error get summary:', why);
  //   }
  //   // if (result && !Util.isEmptyObject(result.producers)) {
  //   //     Logger.log(App.PSPROFILE, "key:", result.producers);
  // }

  async updatePersonalInformation() {
    console.log('DID: ', this.didService.getUserDID());
    console.log('Fullname: ', this.fullName);
    console.log('Jerseyname: ', this.jerseyName);
    console.log('Height: ', this.height);
    console.log('Weight: ', this.weight);
    // console.log('Summary: ', this.summary);
    console.log('DOB: ', this.dob);
    console.log('Location: ', this.location);

    // if (this.dob) {
    //   const tempDOB = new Date(this.dob);
    //   this.dob =
    //     tempDOB.getFullYear() +
    //     '-' +
    //     (tempDOB.getMonth() + 1) +
    //     '-' +
    //     tempDOB.getDate();
    // }

    const param = {
      did: this.didService.getUserDID(),
      fullName: this.fullName,
      jerseyName: this.jerseyName,
      height: this.height,
      weight: this.weight,
      birth: { date: this.dob },
      location: this.location,
    };
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      Authorization: `Bearer ${environment.auth_token}`,
    };

    let rpcApiUrl = environment.base_api_url;
    rpcApiUrl = rpcApiUrl.endsWith('/') ? rpcApiUrl.slice(0, -1) : rpcApiUrl;

    rpcApiUrl = `${rpcApiUrl}/players/${this.didService.getUserDID()}`;

    try {
      const result = await this.globalJsonRPCService.httpPatch(
        rpcApiUrl,
        param,
        headers
      );
      console.log('Update Personal Information Result: ', result);

      let props: any = {
        queryParams: {
          fullName: this.fullName,
          jerseyName: this.jerseyName,
          height: this.height,
          weight: this.weight,
          birth: { date: this.dob },
          location: this.location,
        },
        animationDirection: Direction.BACK,
      };

      void this.globalNavService.navigateRoot(
        App.PSPROFILE,
        '/psprofile/friends',
        props
      );
    } catch (why: any) {
      Logger.log(App.PSPROFILE, 'error update personal information:', why);
    }
  }
}
