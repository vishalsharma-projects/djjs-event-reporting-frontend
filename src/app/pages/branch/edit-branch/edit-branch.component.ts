import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms'
import { LocationService, Branch, BranchPayload, Country, State, District, City, Coordinator } from 'src/app/core/services/location.service'
import { TokenStorageService } from 'src/app/core/services/token-storage.service'
import { Router, ActivatedRoute } from '@angular/router'
import { MessageService } from 'primeng/api'
import { ConfirmationDialogService } from 'src/app/core/services/confirmation-dialog.service'

@Component({
  selector: 'app-edit-branch',
  templateUrl: './edit-branch.component.html',
    styleUrls: ['./edit-branch.component.scss']
})
export class EditBranchComponent implements OnInit {
    branchForm: FormGroup;
    activeMemberType: 'preacher' | 'samarpit' = 'samarpit';
    activeTab: string = 'branch';   // default tab
    branchId: number | null = null;

    //Track progress
    completion = 0; // example, bind dynamically based on form fill %
    circumference = 2 * Math.PI * 45; // radius = 45

    branchName = "";
    branchEmail = "";
    coordinatorName = "";

    // Location data from API
    countryList: Country[] = [];
    stateList: State[] = [];
    cityList: City[] = [];
    districtOptions: District[] = [];
    coordinatorsList: Coordinator[] = [];

    // Loading states
    loadingCountries = false;
    loadingStates = false;
    loadingDistricts = false;
    loadingCities = false;
    loadingCoordinators = false;
    loadingBranch = false;

    // Submitting state
    isSubmitting = false;

    // Breadcrumb items
    breadCrumbItems: Array<{}> = [];

    constructor(
        private fb: FormBuilder,
        private locationService: LocationService,
        private tokenStorage: TokenStorageService,
        private router: Router,
        private route: ActivatedRoute,
        private messageService: MessageService,
        private confirmationDialog: ConfirmationDialogService
    ) { }

    //for Tabs
    setActiveTab(tab: string) {
        this.activeTab = tab;
    }

    ngOnInit(): void {
        console.log('EditBranchComponent - ngOnInit called');

        // Initialize form first
        this.branchForm = this.fb.group({
            coordinator: ['', Validators.required],
            establishedOn: ['', Validators.required],
            ashramArea: ['', Validators.required],
            country: ['', Validators.required],
            pincode: ['', Validators.required],
            postOffice: ['', Validators.required],
            thana: [''],
            tehsil: [''],
            state: ['', Validators.required],
            city: ['', Validators.required],
            addressType: ['', Validators.required],
            address: ['', Validators.required],
            districts: ['', Validators.required],
            areaCovered: [''],
            infrastructure: this.fb.array([
                this.fb.group({
                    roomType: [''],
                    number: ['']
                })
            ]),
            openDays: [''],
            dailyStartTime: [''],
            dailyEndTime: [''],
            status: [true],
            ncr: [false],
            regionId: [''],
            branchCode: [''],
            members: this.fb.array([])
        });

        // Set initial breadcrumbs
        this.breadCrumbItems = [
          { label: 'Branches', routerLink: '/branch' },
          { label: 'Edit Branch', active: true }
        ];

        // Get branch ID from route
        const idParam = this.route.snapshot.paramMap.get('id');
        console.log('Edit Branch - Route ID param:', idParam);

        if (idParam) {
            this.branchId = parseInt(idParam, 10);
            if (isNaN(this.branchId)) {
                console.error('Invalid branch ID:', idParam);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid branch ID' });
                setTimeout(() => {
                    this.router.navigate(['/branch']);
                }, 2000);
                return;
            }
            console.log('Edit Branch - Parsed branch ID:', this.branchId);
        } else {
            console.error('Branch ID is missing from route');
            this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Branch ID is required' });
            setTimeout(() => {
                this.router.navigate(['/branch']);
            }, 2000);
            return;
        }

        // Load countries and coordinators on init
        this.loadCountries();
        this.loadCoordinators();

        // Load branch data after a short delay to ensure coordinators are loaded
        // This ensures findCoordinatorId can find the coordinator
        setTimeout(() => {
            this.loadBranchData();
        }, 500);

        // Listen for changes to reset dependent selects
        this.branchForm.get('country')?.valueChanges.subscribe(countryId => {
            if (countryId) {
                this.loadStates(countryId);
            } else {
                this.stateList = [];
                this.cityList = [];
                this.districtOptions = [];
            }
            // Don't reset if we're loading branch data
            if (!this.loadingBranch) {
                this.branchForm.patchValue({ state: '', city: '', districts: '' });
            }
        });

        this.branchForm.get('state')?.valueChanges.subscribe(stateId => {
            const countryId = this.branchForm.get('country')?.value;
            if (stateId && countryId) {
                this.loadDistricts(stateId, countryId);
                this.loadCities(stateId);
            } else {
                this.cityList = [];
                this.districtOptions = [];
            }
            // Don't reset if we're loading branch data
            if (!this.loadingBranch) {
                this.branchForm.patchValue({ city: '', districts: '' });
            }
        });

        // Watch form changes
        this.branchForm.valueChanges.subscribe(() => {
            this.updateCompletion();
        });

        this.updateCompletion(); // run once on load
    }

    /**
     * Load branch data from API
     */
    loadBranchData() {
        if (!this.branchId) return;

        this.loadingBranch = true;
        this.locationService.getBranchById(this.branchId).subscribe({
            next: (branch) => {
                // Set branch info
                this.branchName = branch.name || '';
                this.branchEmail = branch.email || '';
                this.coordinatorName = branch.coordinator_name || '';

                // Load countries first, then populate form
                this.locationService.getCountries().subscribe({
                    next: (countries) => {
                        this.countryList = countries;
                        // Find country by name (branch.country is an object with name property)
                        const country = countries.find(c => c.name === branch.country?.name || c.id === branch.country_id);
                        if (country) {
                            // Set basic form values first
                            const coordinatorId = this.findCoordinatorId(branch.coordinator_name);
                            this.branchForm.patchValue({
                                coordinator: coordinatorId || '',
                                establishedOn: branch.established_on ? branch.established_on.split('T')[0] : '',
                                ashramArea: branch.aashram_area || 0,
                                country: country.id,
                                pincode: branch.pincode || '',
                                postOffice: branch.post_office || '',
                                thana: branch.police_station || '',
                                address: branch.address || '',
                                openDays: branch.open_days || '',
                                dailyStartTime: branch.daily_start_time || '',
                                dailyEndTime: branch.daily_end_time || '',
                                status: branch.status !== undefined ? branch.status : true,
                                ncr: branch.ncr !== undefined ? branch.ncr : false,
                                regionId: branch.region_id || '',
                                branchCode: branch.branch_code || ''
                            });

                            // Load members for this branch
                            this.loadBranchMembers();

                            // Load states for this country, then set location values
                            this.loadingStates = true;
                            this.locationService.getStatesByCountry(country.id).subscribe({
                                next: (states) => {
                                    this.stateList = states;
                                    this.loadingStates = false;
                                    this.setLocationValues(branch, country.id);
                                },
                                error: (error) => {
                                    console.error('Error loading states:', error);
                                    this.loadingStates = false;
                                    this.loadingBranch = false;
                                }
                            });
                        } else {
                            this.loadingBranch = false;
                        }
                    },
                    error: (error) => {
                        console.error('Error loading countries:', error);
                        this.loadingBranch = false;
                    }
                });
            },
            error: (error) => {
                console.error('Error loading branch:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error.error?.message || 'Failed to load branch data. Please try again.'
                });
                this.loadingBranch = false;
                // Don't navigate away immediately - let user see the error
                // setTimeout(() => {
                //     this.router.navigate(['/branch']);
                // }, 3000);
            }
        });
    }

    /**
     * Set location values (state, city, district) after they're loaded
     */
    setLocationValues(branch: Branch, countryId: number) {
        // Find state by name or ID (branch.state is an object with name property)
        const state = this.stateList.find(s => s.name === branch.state?.name || s.id === branch.state_id);
        if (state) {
            this.branchForm.patchValue({ state: state.id });

            // Load districts and cities for this state
            this.locationService.getDistrictsByStateAndCountry(state.id, countryId).subscribe({
                next: (districts) => {
                    this.districtOptions = districts;
                    // branch.district is an object with name property
                    const district = districts.find(d => d.name === branch.district?.name || d.id === branch.district_id);
                    if (district) {
                        this.branchForm.patchValue({ districts: district.id });
                    }
                    this.loadingDistricts = false;
                },
                error: (error) => {
                    console.error('Error loading districts:', error);
                    this.loadingDistricts = false;
                }
            });

            this.locationService.getCitiesByState(state.id).subscribe({
                next: (cities) => {
                    this.cityList = cities;
                    // branch.city is an object with name property
                    const city = cities.find(c => c.name === branch.city?.name || c.id === branch.city_id);
                    if (city) {
                        this.branchForm.patchValue({ city: city.id });
                    }
                    this.loadingCities = false;
                    this.loadingBranch = false;
                },
                error: (error) => {
                    console.error('Error loading cities:', error);
                    this.loadingCities = false;
                    this.loadingBranch = false;
                }
            });
        } else {
            this.loadingBranch = false;
        }
    }

    /**
     * Find coordinator ID by name
     */
    findCoordinatorId(name: string): number | null {
        const coordinator = this.coordinatorsList.find(c => c.name === name);
        return coordinator ? coordinator.id : null;
    }

    updateCompletion() {
        const controls = this.branchForm.controls;
        const total = Object.keys(controls).length;
        let filled = 0;

        Object.keys(controls).forEach(key => {
            if (controls[key].value && controls[key].value.toString().trim() !== '') {
                filled++;
            }
        });

        this.completion = Math.round((filled / total) * 100);
    }

    get infrastructure(): FormArray {
        return this.branchForm.get('infrastructure') as FormArray;
    }

    addRoomType() {
        this.infrastructure.push(this.fb.group({
            roomType: [''],
            number: ['']
        }));
    }

    get members(): FormArray {
        return this.branchForm.get('members') as FormArray;
    }

    addMember() {
        const memberType = this.branchForm.get('memberType')?.value || 'samarpit';
        this.members.push(this.fb.group({
            id: [null], // null for new members, will be set for existing members
            name: ['', Validators.required],
            role: ['', Validators.required],
            responsibility: [''],
            age: [''],
            dateOfSamarpan: [''],
            qualification: [''],
            dateOfBirth: [''],
            memberType: [memberType, Validators.required]
        }));
    }

    removeMember(index: number) {
        const memberControl = this.members.at(index);
        const memberId = memberControl.get('id')?.value;
        const memberName = memberControl.get('name')?.value || 'this member';

        if (memberId) {
            // Existing member - confirm deletion first
            this.confirmationDialog.confirmDelete({
                title: 'Delete Member',
                text: `Are you sure you want to delete "${memberName}"? This action cannot be undone.`,
                successTitle: 'Member Deleted',
                successText: `Member "${memberName}" deleted successfully`,
                showSuccessMessage: false // We'll use PrimeNG message service instead
            }).then((result) => {
                if (result.value) {
                    this.locationService.deleteBranchMember(memberId).subscribe({
                        next: () => {
                            this.members.removeAt(index);
                            this.messageService.add({
                                severity: 'success',
                                summary: 'Success',
                                detail: `Member "${memberName}" deleted successfully`,
                                life: 3000
                            });
                        },
                        error: (error) => {
                            console.error('Error deleting member:', error);
                            let errorMessage = 'Failed to delete member. Please try again.';

                            if (error.error) {
                                if (error.error.message) {
                                    errorMessage = error.error.message;
                                } else if (error.error.error) {
                                    errorMessage = error.error.error;
                                } else if (typeof error.error === 'string') {
                                    errorMessage = error.error;
                                }
                            } else if (error.message) {
                                errorMessage = error.message;
                            }

                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: errorMessage,
                                life: 5000
                            });
                        }
                    });
                }
            });
        } else {
            // New member - just remove from form (no confirmation needed for unsaved member)
            this.members.removeAt(index);
        }
    }

    switchMemberType(type: 'preacher' | 'samarpit') {
        this.activeMemberType = type;
    }

    get filteredMembers() {
        return this.members.controls.filter(m => m.value.memberType === this.activeMemberType);
    }

    get preacherCount() {
        return this.members.controls.filter(m => m.value.memberType === 'preacher').length;
    }

    get samarpitCount() {
        return this.members.controls.filter(m => m.value.memberType === 'samarpit').length;
    }

    onSubmit() {
        if (this.branchForm.valid && !this.isSubmitting && this.branchId) {
            this.isSubmitting = true;

            const formValue = this.branchForm.value;

            // Get names from IDs (handle both string and number IDs)
            const countryId = formValue.country;
            const stateId = formValue.state;
            const cityId = formValue.city;
            const districtId = formValue.districts;
            const coordinatorId = formValue.coordinator;

            const country = this.countryList.find(c => c.id == countryId || c.id === Number(countryId));
            const state = this.stateList.find(s => s.id == stateId || s.id === Number(stateId));
            const city = this.cityList.find(c => c.id == cityId || c.id === Number(cityId));
            const district = this.districtOptions.find(d => d.id == districtId || d.id === Number(districtId));
            const coordinator = this.coordinatorsList.find(c => c.id == coordinatorId || c.id === Number(coordinatorId));

            // Get current user for updated_by
            const currentUser = this.tokenStorage.getUser();
            const updatedBy = currentUser?.email || currentUser?.name || 'system';
            const currentTimestamp = new Date().toISOString();

            // Format date (convert to ISO string if needed)
            let establishedOn = formValue.establishedOn;
            if (establishedOn && typeof establishedOn === 'string') {
                // If it's already a string, use it as is
                establishedOn = establishedOn;
            } else if (establishedOn) {
                // If it's a Date object, convert to ISO string
                establishedOn = new Date(establishedOn).toISOString();
            }

            // Prepare API payload
            const branchData: BranchPayload = {
                aashram_area: parseFloat(formValue.ashramArea) || 0,
                address: formValue.address || '',
                city_id: city?.id || null,
                contact_number: '', // Not in form, set empty
                coordinator_name: coordinator?.name || '',
                country_id: country?.id || null,
                daily_end_time: formValue.dailyEndTime || '',
                daily_start_time: formValue.dailyStartTime || '',
                district_id: district?.id || null,
                email: this.branchEmail || '',
                established_on: establishedOn || '',
                id: this.branchId,
                name: this.branchName || '',
                open_days: formValue.openDays || '',
                pincode: formValue.pincode || '',
                police_station: formValue.thana || '',
                post_office: formValue.postOffice || '',
                state_id: state?.id || null,
                status: formValue.status !== undefined ? formValue.status : true,
                ncr: formValue.ncr !== undefined ? formValue.ncr : false,
                region_id: formValue.regionId ? parseInt(formValue.regionId, 10) : null,
                branch_code: formValue.branchCode || '',
                updated_by: updatedBy,
                updated_on: currentTimestamp
            };

            // Update branch via API
            this.locationService.updateBranch(this.branchId, branchData).subscribe({
                next: (response) => {
                    console.log('Branch updated successfully:', response);

                    // Save/update members
                    this.saveOrUpdateMembers(() => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Success',
                            detail: 'Branch and members updated successfully!'
                        });
                        this.isSubmitting = false;
                        // Navigate back to branch list
                        setTimeout(() => {
                            this.router.navigate(['/branch']);
                        }, 1500);
                    });
                },
                error: (error) => {
                    console.error('Error updating branch:', error);
                    let errorMessage = 'Failed to update branch. Please try again.';

                    if (error.error) {
                        if (error.error.message) {
                            errorMessage = error.error.message;
                        } else if (error.error.error) {
                            errorMessage = error.error.error;
                        } else if (typeof error.error === 'string') {
                            errorMessage = error.error;
                        }
                    } else if (error.message) {
                        errorMessage = error.message;
                    }

                    if (error.status === 400) {
                        errorMessage = 'Invalid data provided. Please check all fields and try again.';
                    } else if (error.status === 404) {
                        errorMessage = 'Branch not found. It may have been deleted.';
                    } else if (error.status === 403) {
                        errorMessage = 'You do not have permission to update this branch.';
                    } else if (error.status === 409) {
                        errorMessage = 'A branch with this email or contact number already exists.';
                    }

                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: errorMessage,
                        life: 5000
                    });
                    this.isSubmitting = false;
                }
            });
        } else {
            // Mark all fields as touched to show validation errors
            Object.keys(this.branchForm.controls).forEach(key => {
                this.branchForm.get(key)?.markAsTouched();
            });
        }
    }

    /**
     * Load countries from API
     */
    loadCountries() {
        this.loadingCountries = true;
        this.locationService.getCountries().subscribe({
            next: (countries) => {
                this.countryList = countries;
                this.loadingCountries = false;
            },
            error: (error) => {
                console.error('Error loading countries:', error);
                this.loadingCountries = false;
            }
        });
    }

    /**
     * Load states by country ID
     */
    loadStates(countryId: number) {
        this.loadingStates = true;
        this.stateList = [];
        this.locationService.getStatesByCountry(countryId).subscribe({
            next: (states) => {
                this.stateList = states;
                this.loadingStates = false;
            },
            error: (error) => {
                console.error('Error loading states:', error);
                this.loadingStates = false;
            }
        });
    }

    /**
     * Load districts by state ID and country ID
     */
    loadDistricts(stateId: number, countryId: number) {
        this.loadingDistricts = true;
        this.districtOptions = [];
        this.locationService.getDistrictsByStateAndCountry(stateId, countryId).subscribe({
            next: (districts) => {
                this.districtOptions = districts;
                this.loadingDistricts = false;
            },
            error: (error) => {
                console.error('Error loading districts:', error);
                this.loadingDistricts = false;
            }
        });
    }

    /**
     * Load cities by state ID
     */
    loadCities(stateId: number) {
        this.loadingCities = true;
        this.cityList = [];
        this.locationService.getCitiesByState(stateId).subscribe({
            next: (cities) => {
                this.cityList = cities;
                this.loadingCities = false;
            },
            error: (error) => {
                console.error('Error loading cities:', error);
                this.loadingCities = false;
            }
        });
    }

    /**
     * Load coordinators from API
     */
    loadCoordinators() {
        this.loadingCoordinators = true;
        this.locationService.getCoordinators().subscribe({
            next: (coordinators) => {
                this.coordinatorsList = coordinators;
                this.loadingCoordinators = false;
            },
            error: (error) => {
                console.error('Error loading coordinators:', error);
                this.loadingCoordinators = false;
            }
        });
    }

    /**
     * Load branch members from API
     */
    loadBranchMembers() {
        if (!this.branchId) return;

        this.locationService.getBranchMembers(this.branchId).subscribe({
            next: (members) => {
                // Clear existing members
                while (this.members.length !== 0) {
                    this.members.removeAt(0);
                }

                // Add members to form
                members.forEach((member: any) => {
                    this.members.push(this.fb.group({
                        id: [member.id],
                        name: [member.name || '', Validators.required],
                        role: [member.branch_role || '', Validators.required],
                        responsibility: [member.responsibility || ''],
                        age: [member.age || ''],
                        dateOfSamarpan: [member.date_of_samarpan ? member.date_of_samarpan.split('T')[0] : ''],
                        qualification: [member.qualification || ''],
                        dateOfBirth: [member.date_of_birth ? member.date_of_birth.split('T')[0] : ''],
                        memberType: [member.member_type || 'samarpit', Validators.required]
                    }));
                });
            },
            error: (error) => {
                console.error('Error loading branch members:', error);
            }
        });
    }

    /**
     * Save or update members after branch update
     */
    saveOrUpdateMembers(callback?: () => void) {
        const membersToProcess = this.members.controls.filter(m => m.valid);
        if (membersToProcess.length === 0) {
            if (callback) callback();
            return;
        }

        let completed = 0;
        const total = membersToProcess.length;
        let hasError = false;

        membersToProcess.forEach((memberControl) => {
            const memberData = memberControl.value;
            const memberId = memberData.id;
            const memberPayload = {
                branch_id: this.branchId,
                member_type: memberData.memberType,
                name: memberData.name,
                branch_role: memberData.role || '',
                responsibility: memberData.responsibility || '',
                age: memberData.age ? parseInt(memberData.age, 10) : 0,
                date_of_samarpan: memberData.dateOfSamarpan || null,
                qualification: memberData.qualification || '',
                date_of_birth: memberData.dateOfBirth || null
            };

            if (memberId) {
                // Update existing member
                this.locationService.updateBranchMember(memberId, memberPayload).subscribe({
                    next: () => {
                        completed++;
                        if (completed === total && !hasError) {
                            if (callback) callback();
                        }
                    },
                    error: (error) => {
                        console.error('Error updating member:', error);
                        hasError = true;
                        completed++;
                        if (completed === total) {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Warning',
                                detail: 'Branch updated but some members could not be saved.'
                            });
                            if (callback) callback();
                        }
                    }
                });
            } else {
                // Create new member
                this.locationService.createBranchMember(memberPayload).subscribe({
                    next: () => {
                        completed++;
                        if (completed === total && !hasError) {
                            if (callback) callback();
                        }
                    },
                    error: (error) => {
                        console.error('Error creating member:', error);
                        hasError = true;
                        completed++;
                        if (completed === total) {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Warning',
                                detail: 'Branch updated but some members could not be saved.'
                            });
                            if (callback) callback();
                        }
                    }
                });
            }
        });
    }

}
