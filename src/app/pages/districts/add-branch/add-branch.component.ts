import { Component, OnInit } from "@angular/core";
import {
  UntypedFormBuilder,
  Validators,
  UntypedFormGroup,
} from "@angular/forms";
import { LocationService, Country, State, District } from "src/app/core/services/location.service";

@Component({
  selector: "app-add-district",
  templateUrl: "./add-branch.component.html",
  styleUrls: ["./add-branch.component.scss"],
})
export class AddDistrictComponent implements OnInit {
  addDistrictForm: UntypedFormGroup;
  submit: boolean = false;
  isEditMode: boolean = false;
  editingEventId: string | null = null;

  // Location data from API
  countries: Country[] = [];
  states: State[] = [];
  districts: District[] = [];

  // Loading states
  loadingCountries = false;
  loadingStates = false;
  loadingDistricts = false;

  constructor(
    public formBuilder: UntypedFormBuilder,
    private locationService: LocationService
  ) {}

  ngOnInit() {
    this.addDistrictForm = this.formBuilder.group({
      country: ["", [Validators.required]],
      state: ["", [Validators.required]],
      district: ["", [Validators.required]],
    });

    // Load countries on init
    this.loadCountries();

    // Listen to country changes to load states
    this.addDistrictForm
      .get("country")
      ?.valueChanges.subscribe((selectedCountryId) => {
        this.onCountryChange(selectedCountryId);
      });

    // Listen to state changes to load districts
    this.addDistrictForm
      .get("state")
      ?.valueChanges.subscribe((selectedStateId) => {
        this.onStateChange(selectedStateId);
      });

    // Add keyboard event listener for Escape key
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        this.closeModal();
      }
    });
  }

  /**
   * Load countries from API
   */
  loadCountries(): void {
    this.loadingCountries = true;
    this.locationService.getCountries().subscribe({
      next: (countries) => {
        this.countries = countries;
        this.loadingCountries = false;
      },
      error: (error) => {
        console.error('Error loading countries:', error);
        this.loadingCountries = false;
      }
    });
  }

  /**
   * Handle country selection change - load states by country
   */
  onCountryChange(selectedCountryId: string): void {
    if (!selectedCountryId) {
      this.states = [];
      this.districts = [];
      this.addDistrictForm.patchValue({ state: '', district: '' });
      return;
    }

    const countryId = parseInt(selectedCountryId, 10);
    if (isNaN(countryId)) {
      return;
    }

    this.loadingStates = true;
    this.locationService.getStatesByCountry(countryId).subscribe({
      next: (states) => {
        this.states = states;
        this.loadingStates = false;
        // Reset state and district when country changes
        this.addDistrictForm.patchValue({ state: '', district: '' });
        this.districts = [];
      },
      error: (error) => {
        console.error('Error loading states:', error);
        this.loadingStates = false;
        this.states = [];
      }
    });
  }

  get form() {
    return this.addDistrictForm.controls;
  }

  /**
   * Handle state selection change - load districts by state and country
   */
  onStateChange(selectedStateId: string): void {
    if (!selectedStateId) {
      this.districts = [];
      this.addDistrictForm.patchValue({ district: "" });
      return;
    }

    const stateId = parseInt(selectedStateId, 10);
    const countryId = parseInt(this.addDistrictForm.get('country')?.value || '0', 10);

    if (isNaN(stateId) || isNaN(countryId)) {
      return;
    }

    this.loadingDistricts = true;
    this.locationService.getDistrictsByStateAndCountry(stateId, countryId).subscribe({
      next: (districts) => {
        this.districts = districts;
        this.loadingDistricts = false;
        // Reset district when state changes
        this.addDistrictForm.patchValue({ district: "" });
      },
      error: (error) => {
        console.error('Error loading districts:', error);
        this.loadingDistricts = false;
        this.districts = [];
      }
    });
  }

  validSubmit() {
    this.submit = true;
    if (this.addDistrictForm.valid) {
      if (this.isEditMode) {
        console.log("Updating district:", this.addDistrictForm.value);
        // Call update API
        // this.districtService.updateDistrict(this.editingEventId, this.addDistrictForm.value);
      } else {
        console.log("Adding new district:", this.addDistrictForm.value);
        // Call add API
        // this.districtService.addDistrict(this.addDistrictForm.value);
      }

      // Close the modal after successful submission
      setTimeout(() => {
        this.closeModal();
        this.resetForm();
      }, 1000);
    }
  }

  resetForm() {
    this.submit = false;
    this.addDistrictForm.reset();
    this.states = [];
    this.districts = [];
    this.isEditMode = false;
    this.editingEventId = null;
  }

  populateFormForEdit(eventData: any): void {
    this.isEditMode = true;
    this.editingEventId = eventData.id;

    // If country is provided, load states first
    if (eventData.country_id) {
      this.addDistrictForm.patchValue({ country: eventData.country_id });

      // Wait for states to load, then set state
      setTimeout(() => {
        if (eventData.state_id) {
          this.addDistrictForm.patchValue({ state: eventData.state_id });

          // Wait for districts to load, then set district
          setTimeout(() => {
            if (eventData.district_id) {
              this.addDistrictForm.patchValue({ district: eventData.district_id });
            }
          }, 300);
        }
      }, 300);
    } else {
      // Fallback: try to find by name if IDs not available
      // This is less reliable but handles legacy data
      const country = this.countries.find(c => c.name === eventData.country);
      if (country) {
        this.addDistrictForm.patchValue({ country: country.id });
        setTimeout(() => {
          const state = this.states.find(s => s.name === eventData.state);
          if (state) {
            this.addDistrictForm.patchValue({ state: state.id });
            setTimeout(() => {
              const district = this.districts.find(d => d.name === eventData.district);
              if (district) {
                this.addDistrictForm.patchValue({ district: district.id });
              }
            }, 300);
          }
        }, 300);
      }
    }
  }

  closeModal() {
    const modal = document.getElementById("addDistrictModal");
    if (modal) {
      // Try using Bootstrap 5 modal if available
      if (
        typeof (window as any).bootstrap !== "undefined" &&
        (window as any).bootstrap.Modal
      ) {
        const bootstrapModal = (window as any).bootstrap.Modal.getInstance(
          modal
        );
        if (bootstrapModal) {
          bootstrapModal.hide();
        }
      } else {
        // Fallback: manually hide the modal
        modal.classList.remove("show");
        modal.style.display = "none";
        modal.setAttribute("aria-hidden", "true");

        // Remove backdrop
        const backdrop = document.querySelector(".modal-backdrop");
        if (backdrop) {
          backdrop.remove();
        }

        // Remove body class
        document.body.classList.remove("modal-open");
      }
    }
  }
}
