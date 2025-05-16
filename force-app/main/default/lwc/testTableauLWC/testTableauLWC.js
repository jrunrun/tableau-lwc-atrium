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
  _tableau;
  params = '?:embed=y';

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
          this._tableau = window.tabEmbLib;
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
    const container = this.template.querySelector('.tabVizPlaceholder');
    const viz = new this._tableau.TableauViz();
    console.log(viz);

    viz.src = this.generateTableauUrl();
    // viz.token = "123";
    viz.height = "1000px";
    viz.width = "100%";

    viz.addEventListener("vizloaderror", (errorEvent) => {
      console.log("error loading viz");
      const message = JSON.parse(errorEvent.detail.message);
      console.log("error message @ viz load: " + message);
    });

    viz.addEventListener(
      "firstinteractive",
      (onFirstInteractiveEvent) => {
        console.log("viz loaded!");
      }
    );

    container.appendChild(viz);
  }

  generateTableauUrl() {
    let url =
      "https://us-west-2b.online.tableau.com/#/site/atriumnewfall2020/workbooks/2192374/views" + this.params;
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
