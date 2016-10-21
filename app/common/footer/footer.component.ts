import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs/Rx';
import { compact } from 'lodash';
import { Config } from '../../app.config';
import { FooterService } from './footer.service';
import { Angulartics2GoogleAnalytics } from 'angulartics2/src/providers/angulartics2-google-analytics';
import { StreetSettingsService, DrawDividersInterface } from '../street/street.settings.service';

// let device: {desktop: Function; mobile: Function} = require('device.js')();

@Component({
  selector: 'footer',
  templateUrl: './footer.template.html',
  styleUrls: ['./footer.css'],
  encapsulation: ViewEncapsulation.None
})

export class FooterComponent implements OnInit, OnDestroy {
  private page: string;
  private footerData: any;
  private window: Window = window;
  private isMatrixComponent: boolean;
  private streetData: DrawDividersInterface;

  private router: Router;
  private footerService: FooterService;
  private footerServiceSubscribe: Subscription;
  private routerEventsSubscribe: Subscription;
  private streetServiceSubscribe: Subscription;
  private streetSettingsService: StreetSettingsService;
  private angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics;
  // #FIXME: disabled
  // private isDesktop: boolean = device.desktop();
  private isDesktop: boolean = true;

  public constructor(router: Router,
                     footerService: FooterService,
                     streetSettingsService: StreetSettingsService,
                     angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics) {
    this.router = router;
    this.footerService = footerService;
    this.streetSettingsService = streetSettingsService;
    this.angulartics2GoogleAnalytics = angulartics2GoogleAnalytics;
  }

  public ngOnInit(): any {
    this.routerEventsSubscribe = this.router.events.subscribe((event: any) => {
      if (event instanceof NavigationEnd) {
        let activePage: string = event
          .urlAfterRedirects
          .split('?')
          .shift();

        this.isMatrixComponent = activePage === '/matrix';

        activePage = compact(activePage.split('/')).shift();

        if (activePage !== this.page) {
          document.body.classList.add(activePage);
          document.body.classList.remove(this.page);
        }

        this.page = activePage;
      }
    });

    this.streetServiceSubscribe = this.streetSettingsService
      .getStreetSettings()
      .subscribe((res: any) => {
        if (res.err) {
          console.error(res.err);
          return;
        }

        this.streetData = res.data;
      });

    this.footerServiceSubscribe = this.footerService.getFooter()
      .subscribe((val: any) => {
        if (val.err) {
          console.error(val.err);
          return;
        }

        this.footerData = val.data;
      });
  }

  public ngOnDestroy(): void {
    this.routerEventsSubscribe.unsubscribe();
    this.footerServiceSubscribe.unsubscribe();
  }

  protected goToMatrixPage(): void {
    this.angulartics2GoogleAnalytics.eventTrack('Go to Matrix page from footer', {});

    let queryParams: any = {
      thing: 'Families',
      countries: 'World',
      regions: 'World',
      zoom: 4,
      row: 1,
      lowIncome: this.streetData.poor,
      highIncome: this.streetData.rich
    };

    if (this.isMatrixComponent) {
      this.window.location.href = this.window.location.origin + this.window.location.pathname + '?' + this.objToQuery(queryParams);

      return;
    }

    if (!this.isDesktop) {
      queryParams.zoom = 3;
    }

    this.router.navigate(['/matrix'], {queryParams: queryParams});
  }

  public scrollTop(e: MouseEvent): void {
    e.preventDefault();

    Config.animateScroll('scrollBackToTop', 20, 1000);
  };

  private objToQuery(data: any): string {
    return Object.keys(data).map((k: string) => {
      return encodeURIComponent(k) + '=' + data[k];
    }).join('&');
  }
}
