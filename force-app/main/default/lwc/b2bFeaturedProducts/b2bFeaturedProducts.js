import { LightningElement, api, track } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { getPathPrefix } from "lightning/configProvider"; // Provides the path prefix to Core resources, like CMS (https://salesforce.quip.com/1FZjAXYICqML)

// CONTROLLER METHODS
import getProductsBySku from "@salesforce/apex/SDO_B2BCommerce_FeaturedProducts.getProductsBySku";
import getProductsByCategoryId from "@salesforce/apex/SDO_B2BCommerce_FeaturedProducts.getProductsByCategoryId";
import getProductsByFieldValue from "@salesforce/apex/SDO_B2BCommerce_FeaturedProducts.getProductsByFieldValue";
// import resolveCommunityIdToWebstoreId from "@salesforce/apex/B2B_FeaturedProducts_Controller.resolveCommunityIdToWebstoreId";
import fetchInitValues from "@salesforce/apex/SDO_B2BCommerce_FeaturedProducts.fetchInitValues";
import getUserAccountID from "@salesforce/apex/SDO_B2BCommerce_FeaturedProducts.getUserAccountID";

// STORE IDS
import USERID from "@salesforce/user/Id";
import COMMUNITYID from "@salesforce/community/Id";
import CURRENCY_CODE from "@salesforce/i18n/currency";
import BASE_PATH from "@salesforce/community/basePath";

// LABELS
import searchErrorTitle from "@salesforce/label/c.B2B_FP_Search_Error_Title";
import altPleaseWait from "@salesforce/label/c.B2B_FP_Alt_Text_Please_Wait";
import noProducts from "@salesforce/label/c.B2B_FP_No_Products";

import { getPreviewProducts } from "c/b2bFeaturedProductsPreview";
import previewStaticResource from "@salesforce/resourceUrl/SDO_B2BCommerce_LE_Pictures";

export default class B2bFeaturedProducts extends LightningElement {
  // @api flexipageRegionWidth; // https://developer.salesforce.com/docs/component-library/documentation/en/lwc/lwc.use_width_aware

  labels = {
    toast: {
      searchErrorTitle: searchErrorTitle
    },
    component: {
      altPleaseWait: altPleaseWait,
      noProducts: noProducts
    }
  };

  products = [];
  @track hasProducts = false;

  // These properties are set within experience builder and passed to the component
  @api featuredProductStyle;

  @api showHeading;
  @api featuredProductsHeading;
  @api featuredProductsHeadingSize;
  @api featuredProductsHeadingAlignment;

  @api featuredProductsBodySize;
  @api featuredProductsBodyAlignment;

  @api showSKU;
  @api showDescription;
  @api includePrices;

  @api featuredProductsComponentBackgroundColor;
  @api featuredProductsBackgroundColor;
  @api featuredProductsBorderColor;
  @api featuredProductsHeadingColor;
  @api featuredProductsSkuColor;
  @api featuredProductsDescriptionColor;
  @api featuredProductsPriceColor;

  @api productSource;
  @api skuList;
  @api categoryId;
  @api effectiveAccountId;

  @api fieldValue;
  @api compareType;
  @api fieldApiName;

  @track showLoadingSpinner = false;
  @track templateWidth;
  @track templateSize;
  @track tileWidth;
  @track tileHeight;

  communityId = COMMUNITYID;
  currencyCode = CURRENCY_CODE;
  userId = USERID;
  webstoreId;
  skuListFormatted;

  initialLoad = false;

  connectedCallback() {
    console.log("connected call back");

    window.scrollTo(0, 0);
    console.log("scrolled to top");

    if (this.skuList) {
      this.skuListFormatted = this.skuList.replace(/\s*,\s*/g, ",");
      this.skuListFormatted = this.skuListFormatted.split(",");
    }

    if (!this.effectiveAccountId) {
      getUserAccountID({})
        .then((result) => {
          this.effectiveAccountId = result;
          this.doInit();
        })
        .catch((error) => {
          // there is nothing we can do
        });
    } else {
      this.doInit();
    }
  }

  doInit() {
    fetchInitValues({
      communityId: this.communityId,
      effectiveAccountId: this.effectiveAccountId
    })
      .then((result) => {
        if (result) {
          this.webstoreId = result.webstoreId;
          this.effectiveAccountId = result.effectiveAccountId;
          this.doProductLoad();
        }
      })
      .catch((error) => {
        console.log("fetchInitValues(): error");
        console.log(error);
        this.showLoadingSpinner = false;
        this.dispatchEvent(
          new ShowToastEvent({
            title: this.labels.toast.searchErrorTitle,
            message: error.message,
            variant: "error"
          })
        );
      });
  }

  doProductLoad() {
    /*
			A user in Experience Builder does have a userId and an effectiveAccountId of zeroes.
			Guest users don't have a userId but have an effectiveAccountId of zeroes.
		*/
    if (
      this.userId !== undefined &&
      this.effectiveAccountId === "000000000000000"
    ) {
      this.products = this.getPreviewProducts();
      return;
    }

    this.showLoadingSpinner = true;

    if (this.productSource === "SKU List") {
      this.loadProductsBySku();
    }

    if (this.productSource === "Category ID") {
      this.loadProductsByCategoryId();
    }

    if (this.productSource === "Field") {
      this.loadProductsByField();
    }
  }

  loadProductsBySku() {
    getProductsBySku({
      webstoreId: this.webstoreId,
      effectiveAccountId:
        this.effectiveAccountId === "000000000000000"
          ? null
          : this.effectiveAccountId,
      skuList: this.skuListFormatted,
      includePrices: this.includePrices
    })
      .then((result) => {
        this.processResult(result);
      })
      .catch((error) => {
        this.processError(error);
      });
  }

  loadProductsByCategoryId() {
    getProductsByCategoryId({
      webstoreId: this.webstoreId,
      effectiveAccountId:
        this.effectiveAccountId === "000000000000000"
          ? null
          : this.effectiveAccountId,
      categoryId: this.categoryId,
      includePrices: this.includePrices
    })
      .then((result) => {
        this.processResult(result);
      })
      .catch((error) => {
        this.processError(error);
      });
  }

  loadProductsByField() {
    getProductsByFieldValue({
      webstoreId: this.webstoreId,
      effectiveAccountId:
        this.effectiveAccountId === "000000000000000"
          ? null
          : this.effectiveAccountId,
      fieldApiName: this.fieldApiName,
      fieldValue: this.fieldValue,
      compareType: this.compareType,
      includePrices: this.includePrices
    })
      .then((result) => {
        this.processResult(result);
      })
      .catch((error) => {
        this.processError(error);
      });
  }

  processResult(result) {
    this.showLoadingSpinner = false;

    if (result && result.data) {
      this.hasProducts = true;
      let productResults = JSON.parse(result.data);

      this.processProductResults(productResults);
    }

    this.processMessages(result);
  }

  processProductResults(productResults) {
    for (const product of productResults) {
      // format image url
      let url = product.defaultImage.url;

      if (url.includes("cms")) {
        console.log("inside cms");
        let firstPart = url.slice(0, url.lastIndexOf("?version"));
        let theId = firstPart.substring(firstPart.indexOf("media/"));
        console.log("the Id is", theId);

        url = BASE_PATH + "/sfsites/c/cms/delivery/" + theId;
      }

      if (url.includes("default")) {
        url = BASE_PATH + "/sfsites/c" + url;
      }

      product.defaultImage.url = url;
      // format product link
      let prodLink = BASE_PATH + "/product/" + product.id;
      product.productLink = prodLink;

      this.products.push(product);
    }
  }

  processError(error) {
    this.showLoadingSpinner = false;
    this.dispatchEvent(
      new ShowToastEvent({
        title: this.labels.toast.searchErrorTitle,
        message: error.body?.message || error,
        variant: "error"
      })
    );
  }

  processMessages(result) {
    if (result.messagesJson) {
      let messages = JSON.parse(result.messagesJson);

      if (!messages) {
        return;
      }

      // Process messages returned
      // Display toasts when applicable
      // Create content for the details section

      for (var i = 0; i < messages.length; i++) {
        var message = messages[i];

        if (message.toast === true) {
          this.dispatchEvent(
            new ShowToastEvent({
              title: message.title,
              message: message.message,
              variant: message.severity
            })
          );
        }
      }

      this.showProcessLog = true;
    }
  }

  getPreviewProducts() {
    const products = getPreviewProducts(getPathPrefix(), previewStaticResource);

    this.hasProducts = true;

    return products;
  }

  // GETTERS & SETTERS
  get communityName() {
    let path = BASE_PATH;
    let pos = BASE_PATH.lastIndexOf("/s");
    if (pos >= 0) {
      path = BASE_PATH.substring(0, pos);
    }

    return path;
  }

  get headingSize() {
    let sizeClass = "slds-text-heading_";
    if (this.featuredProductsHeadingSize) {
      sizeClass += this.featuredProductsHeadingSize.toLowerCase();
    }
    return sizeClass;
  }

  get bodySize() {
    let sizeClass = "slds-text-body_";
    if (this.featuredProductsBodySize) {
      sizeClass += this.featuredProductsBodySize.toLowerCase();
    }
    return sizeClass;
  }

  // ALIGNMENT GETTERS
  get headingAlignment() {
    let alignmentClass = "slds-text-align_";
    if (this.featuredProductsHeadingAlignment) {
      alignmentClass += this.featuredProductsHeadingAlignment.toLowerCase();
    }
    return alignmentClass;
  }

  get bodyAlignment() {
    let alignmentClass = "slds-text-align_";
    if (this.featuredProductsBodyAlignment) {
      alignmentClass += this.featuredProductsBodyAlignment.toLowerCase();
    }
    return alignmentClass;
  }

  // COLOR GETTERS
  get componentStyles() {
    return `background-color:${this.featuredProductsComponentBackgroundColor};`;
  }

  get cardStyles() {
    return `background-color:${this.featuredProductsBackgroundColor}; border-color:${this.featuredProductsBorderColor};`;
  }

  get headingColor() {
    return `color:${this.featuredProductsHeadingColor};`;
  }

  get skuColor() {
    return `color:${this.featuredProductsSkuColor};`;
  }

  get descriptionColor() {
    return `color:${this.featuredProductsDescriptionColor};`;
  }

  get priceColor() {
    return `color:${this.featuredProductsPriceColor};`;
  }
}