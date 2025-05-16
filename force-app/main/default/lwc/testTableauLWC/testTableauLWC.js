// tableauDashboard.js
import { LightningElement, wire, track, api } from "lwc";
import generateJWT from "@salesforce/apex/CATokenGenerator.generateJWT";
import getUserDetails from "@salesforce/apex/CATokenGenerator.getUserDetails";
import getViews from "@salesforce/apex/CATokenGenerator.getViews";
import getTableauEnvConfig from "@salesforce/apex/CATokenGenerator.getTableauEnvConfig";
import getCurrentUserOpportunities from "@salesforce/apex/CATokenGenerator.getCurrentUserOpportunities";
import { NavigationMixin } from "lightning/navigation";
// import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript } from "lightning/platformResourceLoader";

export default class TableauDashboard extends LightningElement {
  @api recordId; // This will hold the current Account ID from the record page
  @api filterFieldName = "ID"; // The name of the field in your Tableau dashboard to filter on
  @api vizHeight = "800px"; // Set desired height
  @api deviceType = "desktop"; // 'desktop', 'tablet', 'phone'
  @api toolbarPosition = "bottom"; // 'top', 'bottom', 'hidden'
  @api hideTabs = false;

  tableauInitialized = false;

  renderedCallback() {
    if (!this.tableauInitialized) {
      this.initializeTableau().then(() => {
        this.tableauInitialized = true;
        this.initViz();
      });
    }
  }

  async initializeTableau() {
    try {
      this.baseUrl = window.location.origin;
      this.SCRIPT_PATH = "/js/tableau/tableau.embedding.latest.min.js";
      this.SCRIPT_PATH_ALT = "/sfsites/c" + this.SCRIPT_PATH;

      loadScript(this, this.baseUrl + this.SCRIPT_PATH)
        .then(() => {
          console.log("Custom script loaded successfully");
        })
        .catch((error) => {
          console.error(
            "Failed to load using " +
              this.SCRIPT_PATH +
              " - now trying " +
              this.SCRIPT_PATH_ALT
          );
          return loadScript(this, this.baseUrl + this.SCRIPT_PATH_ALT);
        })
        .then(() => {
          console.log("Custom script loaded successfully");
        });
    } catch (error) {
      console.error("Error loading Tableau JS API:", error);
    }
  }

  initViz() {
    let container = this.template.querySelector('[data-id="tableauViz"]');
    console.log(container);

    container.src = this.generateTableauUrl();
    // container.token = "123";
    container.height = "1000px";
    container.width = "100%";

    container.addEventListener("vizloaderror", (errorEvent) => {
      console.log("error loading viz");
      const message = JSON.parse(errorEvent.detail.message);
      console.log("error message @ viz load: " + message);
    });

    container.addEventListener(
      "firstinteractive",
      (onFirstInteractiveEvent) => {
        console.log("viz loaded!");
      }
    );
  }

  generateTableauUrl() {
    let url =
      "https://us-west-2b.online.tableau.com/#/site/atriumnewfall2020/workbooks/2192374/views";
    if (this.recordId) {
      url += `?${this.filterFieldName}=${this.recordId}`;
    }
    return url;
  }

  applyFilter() {
    if (this.tableauViz && this.recordId) {
      const filterOptions = {
        isMultipleValues: false
      };
      this.tableauViz
        .getWorkbook()
        .getActiveSheet()
        .applyFilterAsync(this.filterFieldName, this.recordId, filterOptions);
    }
  }

  handleTabSwitch(event) {
    console.log("Tableau tab switched (if event captured):", event);
    this.applyFilter(); // Attempt to re-apply filter on tab switch
  }
}
