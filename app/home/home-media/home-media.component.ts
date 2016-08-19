import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  Inject,
  EventEmitter,
  NgZone,
  AfterViewChecked,
  ElementRef
} from '@angular/core';
import { fromEvent } from 'rxjs/observable/fromEvent';
import { Subscriber, Subscription } from 'rxjs/Rx';
import { RowLoaderComponent } from '../../common/row-loader/row-loader.component';
import { HomeMediaViewBlockComponent } from './home-media-view-block/home-media-view-block.component';
import { LoaderComponent } from '../../common/loader/loader.component';

let tpl = require('./home-media.template.html');
let style = require('./home-media.css');

@Component({
  selector: 'home-media',
  template: tpl,
  styles: [style],
  directives: [HomeMediaViewBlockComponent, RowLoaderComponent, LoaderComponent]
})

export class HomeMediaComponent implements OnInit, OnDestroy, AfterViewChecked {
  protected loader: boolean = false;
  protected zoom: number = 4;

  protected itemSize: number;
  protected imageData: any = {};
  protected imageBlockLocation: number;
  protected showImageBlock: boolean = false;
  protected activeImage: any;

  @Input('placeId')
  private placeId: string;
  @Input('activeImageIndex')
  private activeImageIndex: number;

  @Output('activeImageOptions')
  private activeImageOptions: EventEmitter<any> = new EventEmitter<any>();

  private prevImageId: string;
  private homeMediaService: any;
  private images: any = [];
  private familyPlaceServiceSubscribe: Subscriber<any>;
  private resizeSubscribe: Subscription;
  private zone: NgZone;
  private imageHeight: number;
  private footerHeight: number;
  private headerHeight: number;
  private imageOffsetHeight: any;
  private isInit: boolean = true;
  private indexViewBoxImage: number;
  private windowInnerWidth: number = window.innerWidth;
  private element: HTMLElement;
  private imageMargin: number;

  public constructor(@Inject('HomeMediaService') homeMediaService: any,
                     @Inject(NgZone) zone: NgZone,
                     @Inject(ElementRef) element: ElementRef) {
    this.homeMediaService = homeMediaService;
    this.zone = zone;
    this.element = element.nativeElement;
  }

  public ngOnInit(): void {
    if (this.windowInnerWidth > 767 && this.windowInnerWidth < 1024) {
      this.zoom = 3;
    }

    if (this.windowInnerWidth <= 767) {
      this.zoom = 2;
    }

    this.familyPlaceServiceSubscribe = this.homeMediaService.getHomeMedia(`placeId=${this.placeId}`)
      .subscribe((res: any) => {
        if (res.err) {
          console.error(res.err);
          return;
        }

        this.images = res.data.images;
        this.imageData.photographer = res.data.photographer;
      });

    let platform = navigator.platform;
    let nAgt = navigator.userAgent;
    let verOffset = nAgt.indexOf('Safari');
    let isSafari = false;

    if (platform === 'iPhone' || platform === 'iPod' || platform === 'iPad') {
      if (verOffset !== -1) {
        isSafari = true;
      }
    }

    this.resizeSubscribe = fromEvent(window, 'resize')
      .debounceTime(300)
      .subscribe(() => {
        this.zone.run(() => {
          if (isSafari && this.windowInnerWidth === window.innerWidth) {
            return;
          }

          this.zoom = 4;
          this.windowInnerWidth = window.innerWidth;

          if (this.windowInnerWidth > 767 && this.windowInnerWidth < 1024) {
            this.zoom = 3;
          }

          if (this.windowInnerWidth <= 767) {
            this.zoom = 2;
          }

          this.getImageHeight();

          if (this.indexViewBoxImage) {
            let countByIndex: number = (this.indexViewBoxImage + 1) % this.zoom;
            let offset: number = this.zoom - countByIndex;

            this.imageData.index = !countByIndex ? this.zoom : countByIndex;
            this.imageBlockLocation = countByIndex ? offset + this.indexViewBoxImage : this.indexViewBoxImage;

            this.zone.run(() => this.goToRow(Math.ceil((this.indexViewBoxImage + 1) / this.zoom)));
          }
        });
      });
  }

  public ngAfterViewChecked(): void {
    let footer = document.querySelector('.footer') as HTMLElement;
    let imgContent = document.querySelector('.family-image-container') as HTMLElement;
    let headerContainer = document.querySelector('.header-container') as HTMLElement;

    if (!imgContent) {
      return;
    }

    if (this.headerHeight === headerContainer.offsetHeight && this.footerHeight === footer.offsetHeight &&
      this.imageOffsetHeight === imgContent.offsetHeight || !document.querySelector('.family-image-container')) {
      return;
    }

    this.headerHeight = headerContainer.offsetHeight;
    this.footerHeight = footer.offsetHeight;
    this.imageOffsetHeight = imgContent.offsetHeight;

    setTimeout(() => {
      this.getImageHeight();
      this.loader = true;
    });

    if (this.activeImageIndex && this.isInit) {
      this.isInit = false;

      setTimeout(() => this.openMedia(this.images[this.activeImageIndex - 1], this.activeImageIndex - 1));
    }
  }

  public ngOnDestroy(): void {
    this.familyPlaceServiceSubscribe.unsubscribe();

    if (this.resizeSubscribe) {
      this.resizeSubscribe.unsubscribe();
    }
  }

  protected openMedia(image: any, index: number): void {
    this.activeImage = image;
    this.indexViewBoxImage = index;
    let countByIndex: number = (this.indexViewBoxImage + 1) % this.zoom;
    let offset: number = this.zoom - countByIndex;

    this.imageBlockLocation = countByIndex ? offset + this.indexViewBoxImage : this.indexViewBoxImage;

    this.imageData.index = !countByIndex ? this.zoom : countByIndex;
    this.imageData.placeId = this.placeId;
    this.imageData.imageId = image._id;
    this.imageData.thing = {
      _id: image.thing,
      plural: image.plural,
      thingName: image.thingName,
      icon: image.thingIcon.replace('FFFFFF', '2C4351')
    };

    this.imageData.image = image.background
      .replace('thumb', 'desktops')
      .replace('url("', '')
      .replace('")', '');

    this.imageData = Object.assign({}, this.imageData);

    if (!this.prevImageId) {
      this.prevImageId = image._id;
      this.showImageBlock = !this.showImageBlock;

      this.changeUrl(Math.ceil((this.indexViewBoxImage + 1) / this.zoom), this.indexViewBoxImage + 1);

      return;
    }

    if (this.prevImageId === image._id) {
      this.showImageBlock = !this.showImageBlock;

      if (!this.showImageBlock) {
        this.prevImageId = '';
      }

      this.changeUrl();
    } else {
      this.prevImageId = image._id;
      this.showImageBlock = true;

      this.changeUrl(Math.ceil((this.indexViewBoxImage + 1) / this.zoom), this.indexViewBoxImage + 1);
    }
  }

  private changeUrl(row?: number, activeImageIndex?: number): void {
    if (!row && !activeImageIndex) {
      this.activeImageOptions.emit({});

      return;
    }

    this.activeImageOptions.emit({activeImageIndex: activeImageIndex});
    this.goToRow(row);
  }

  private goToRow(row: number): void {
    let header = document.querySelector('.header-container') as HTMLElement;
    let homeDescription = document.querySelector('.home-description-container') as HTMLElement;
    let shortFamilyInfo = document.querySelector('.short-family-info-container') as HTMLElement;
    let headerHeight: number = homeDescription.offsetHeight - header.offsetHeight - shortFamilyInfo.offsetHeight;

    document.body.scrollTop = document.documentElement.scrollTop = row * this.itemSize + headerHeight - 45;
  }

  private getImageHeight(): void {
    let boxContainer = this.element.querySelector('.family-things-container') as HTMLElement;
    let imgContent = this.element.querySelector('.family-image-container') as HTMLElement;

    let widthScroll: number = window.innerWidth - document.body.offsetWidth;

    let imageMarginLeft: string = window.getComputedStyle(imgContent).getPropertyValue('margin-left');
    let boxPaddingLeft: string = window.getComputedStyle(boxContainer).getPropertyValue('padding-left');

    this.imageMargin = parseFloat(imageMarginLeft) * 2;
    let boxContainerPadding: number = parseFloat(boxPaddingLeft) * 2;

    this.imageHeight = (boxContainer.offsetWidth - boxContainerPadding - widthScroll) / this.zoom - this.imageMargin;
    this.itemSize = this.imageHeight + this.imageMargin;
  }
}
