import { Component, OnInit, Input, ElementRef, Inject, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { Subscription } from 'rxjs/Rx';

const _ = require('lodash');

let tpl = require('./street-mobile.template.html');
let style = require('./street-mobile.css');

@Component({
  selector: 'street-mobile',
  template: tpl,
  styles: [style]
})

export class StreetMobileComponent implements OnInit, OnDestroy {
  @Input('places')
  private places: Observable<any>;

  private street: any;
  private streetSettingsService: any;
  private streetData: any;
  private element: HTMLElement;
  private streetServiceSubscrib: Subscription;
  private resize: any;

  private placesSubscribe: Subscription;
  private svg: SVGElement;
  private placesArr: any;

  public constructor(element: ElementRef,
                     @Inject('StreetSettingsService') streetSettingsService: any,
                     @Inject('StreetMobileDrawService') streetDrawService: any) {
    this.element = element.nativeElement;
    this.street = streetDrawService;
    this.streetSettingsService = streetSettingsService;
  }

  public ngOnInit(): any {
    this.street.setSvg = this.svg = this.element.querySelector('.street-box svg') as SVGElement;
    this.street.set('isInit', true);

    this.placesSubscribe = this.places && this.places.subscribe((places: any): void => {
        this.placesArr = places;

        if (!this.streetData) {
          return;
        }

        this.setDividers(this.placesArr);
      });

    this.streetServiceSubscrib = this.streetSettingsService.getStreetSettings()
      .subscribe((res: any) => {
        if (res.err) {
          console.error(res.err);
          return;
        }

        this.streetData = res.data;

        if (!this.placesArr) {
          return;
        }

        this.setDividers(this.placesArr);
      });

    this.resize = fromEvent(window, 'resize')
      .debounceTime(150)
      .subscribe(() => {
        if (!this.street.places) {
          return;
        }

        this.setDividers(this.placesArr);
      });
  }

  public ngOnDestroy(): void {
    if (this.resize) {
      this.resize.unsubscribe();
    }

    if (this.placesSubscribe) {
      this.placesSubscribe.unsubscribe();
    }

    if (this.streetServiceSubscrib) {
      this.streetServiceSubscrib.unsubscribe();
    }
  }

  private setDividers(places: any): void {
    this.street
      .clearSvg()
      .init(this.streetData)
      .set('places', _.sortBy(places, 'income'))
      .set('fullIncomeArr', _
        .chain(this.street.places)
        .sortBy('income')
        .map((place: any) => {
          if (!place) {
            return void 0;
          }

          return this.street.scale(place.income);
        })
        .compact()
        .value())
      .drawScale(places);
  }
}