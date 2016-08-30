import { Component, Output, EventEmitter, Input, OnInit, Inject } from '@angular/core';
import { StreetFilterComponent } from '../street-filter/street-filter.component';
import { Subscription } from 'rxjs';

let tpl = require('./income-filter.template.html');
let style = require('./income-filter.css');

@Component({
  selector: 'income-filter',
  template: tpl,
  styles: [style],
  directives: [StreetFilterComponent]
})

export class IncomeFilterComponent implements OnInit {
  @Input('places')
  protected places: any[];
  @Input('lowIncome')
  protected lowIncome: number;
  @Input('highIncome')
  protected highIncome: number;
  @Output('sendResponse')
  private sendResponse: EventEmitter<any> = new EventEmitter<any>();
  private range: {lowIncome: number; highIncome: number; close?: boolean} = {
    lowIncome: this.lowIncome,
    highIncome: this.highIncome
  };
  private streetData: any;
  private streetSettingsService: any;
  private streetServiceSubscribe: Subscription;

  public constructor(@Inject('StreetSettingsService') streetSettingsService: any) {
    this.streetSettingsService = streetSettingsService;
  }

  public ngOnInit(): void {
    this.streetServiceSubscribe = this.streetSettingsService.getStreetSettings()
      .subscribe((res: any) => {
        if (res.err) {
          console.error(res.err);
          return;
        }
        this.streetData = res.data;
        console.log(this.streetData);
      });
  }

  protected closeFilter(isClose?: boolean): void {
    if (isClose) {
      this.sendResponse.emit({close: true});
      return;
    }

    this.range.close = true;

    this.sendResponse.emit(this.range);
  }

  protected getFilter(data: {lowIncome: number;highIncome: number}): void {
    this.range = data;
  }

  protected showAll(): void {
    this.range.lowIncome = this.streetData.poor;
    this.range.highIncome = this.streetData.rich;
    this.range.close = true;

    this.sendResponse.emit(this.range);
  }
}