import { Component, OnInit } from '@angular/core'
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms'
import { LocationService, Country, State, City, Branch, InfrastructureType } from 'src/app/core/services/location.service'
import { ChildBranchService, ChildBranch, ChildBranchPayload } from 'src/app/core/services/child-branch.service'
import { Router, ActivatedRoute } from '@angular/router'
import { MessageService } from 'primeng/api'

@Component({
    selector: 'app-edit-child-branch',
    templateUrl: './edit-child-branch.component.html',
    styleUrls: ['./edit-child-branch.component.scss']
})
export class EditChildBranchComponent implements OnInit {
    childBranchForm: FormGroup;
    childBranchId: number | null = null;
    childBranch: ChildBranch | null = null;
    parentBranch: Branch | null = null;
    parentCoordinatorName: string = '';

    // Location data
    countryList: Country[] = [];
    stateList: State[] = [];
    cityList: City[] = [];
    infrastructureTypesList: InfrastructureType[] = [];

    // Loading states
    loading = false;
    loadingInfrastructureTypes = false;
    isSubmitting = false;

    breadCrumbItems: Array<{}> = [];

    constructor(
        private fb: FormBuilder,
        private locationService: LocationService,
        private childBranchService: ChildBranchService,
        private router: Router,
        private route: ActivatedRoute,
        private messageService: MessageService
    ) { }

    ngOnInit(): void {
        const idParam = this.route.snapshot.paramMap.get('id');
        if (idParam) {
            this.childBranchId = parseInt(idParam, 10);
            if (isNaN(this.childBranchId)) {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid child branch ID' });
                this.router.navigate(['/branch']);
                return;
            }
        } else {
            this.router.navigate(['/branch']);
            return;
        }

        this.childBranchForm = this.fb.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            contactNumber: ['', Validators.required],
            establishedOn: ['', Validators.required],
            ashramArea: ['', Validators.required],
            country: ['', Validators.required],
            pincode: ['', Validators.required],
            postOffice: ['', Validators.required],
            thana: [''],
            state: ['', Validators.required],
            city: ['', Validators.required],
            address: ['', Validators.required],
            openDays: [''],
            dailyStartTime: [''],
            dailyEndTime: [''],
            status: [true],
            ncr: [false],
            regionId: [''],
            branchCode: [''],
            infrastructure: this.fb.array([
                this.fb.group({
                    roomType: [''],
                    number: ['']
                })
            ])
        });

        this.breadCrumbItems = [
            { label: 'Branches', routerLink: '/branch' },
            { label: 'Edit Child Branch', active: true }
        ];

        this.loadCountries();
        this.loadInfrastructureTypes();
        this.loadChildBranch();

        this.childBranchForm.get('country')?.valueChanges.subscribe(countryId => {
            if (countryId) {
                this.loadStates(countryId);
            }
        });

        this.childBranchForm.get('state')?.valueChanges.subscribe(stateId => {
            if (stateId) {
                this.loadCities(stateId);
            }
        });
    }

    loadChildBranch() {
        if (!this.childBranchId) return;
        this.loading = true;

        this.childBranchService.getChildBranchById(this.childBranchId).subscribe({
            next: (childBranch) => {
                this.childBranch = childBranch;
                this.parentCoordinatorName = childBranch.coordinator_name || '';

                // Load parent branch
                if (childBranch.parent_branch_id) {
                    this.locationService.getBranchById(childBranch.parent_branch_id).subscribe({
                        next: (parent) => {
                            this.parentBranch = parent;
                        },
                        error: (error) => console.error('Error loading parent branch:', error)
                    });
                }

                // Load location data
                if (childBranch.country_id) {
                    this.loadStates(childBranch.country_id);
                    if (childBranch.state_id) {
                        this.loadCities(childBranch.state_id);
                    }
                }

                // Populate form
                let establishedDate = '';
                if (childBranch.established_on) {
                    const date = new Date(childBranch.established_on);
                    establishedDate = date.toISOString().split('T')[0];
                }

                this.childBranchForm.patchValue({
                    name: childBranch.name || '',
                    email: childBranch.email || '',
                    contactNumber: childBranch.contact_number || '',
                    establishedOn: establishedDate,
                    ashramArea: childBranch.aashram_area || 0,
                    country: childBranch.country_id || '',
                    state: childBranch.state_id || '',
                    city: childBranch.city_id || '',
                    address: childBranch.address || '',
                    pincode: childBranch.pincode || '',
                    postOffice: childBranch.post_office || '',
                    thana: childBranch.police_station || '',
                    openDays: childBranch.open_days || '',
                    dailyStartTime: childBranch.daily_start_time || '',
                    dailyEndTime: childBranch.daily_end_time || '',
                    status: childBranch.status !== undefined ? childBranch.status : true,
                    ncr: childBranch.ncr !== undefined ? childBranch.ncr : false,
                    regionId: childBranch.region_id ? childBranch.region_id.toString() : '',
                    branchCode: childBranch.branch_code || ''
                });

                // Load infrastructure data
                this.loadBranchInfrastructure();

                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading child branch:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load child branch' });
                this.loading = false;
                this.router.navigate(['/branch']);
            }
        });
    }

    loadCountries() {
        this.locationService.getCountries().subscribe({
            next: (countries) => this.countryList = countries,
            error: (error) => console.error('Error loading countries:', error)
        });
    }

    loadStates(countryId: number) {
        this.locationService.getStatesByCountry(countryId).subscribe({
            next: (states) => this.stateList = states,
            error: (error) => console.error('Error loading states:', error)
        });
    }

    loadCities(stateId: number) {
        this.locationService.getCitiesByState(stateId).subscribe({
            next: (cities) => {
                this.cityList = cities;
            },
            error: (error) => console.error('Error loading cities:', error)
        });
    }

    /**
     * Load infrastructure types from API
     */
    loadInfrastructureTypes() {
        this.loadingInfrastructureTypes = true;
        this.locationService.getInfrastructureTypes().subscribe({
            next: (types) => {
                this.infrastructureTypesList = types;
                this.loadingInfrastructureTypes = false;
            },
            error: (error) => {
                console.error('Error loading infrastructure types:', error);
                this.loadingInfrastructureTypes = false;
            }
        });
    }

    get infrastructure(): FormArray {
        return this.childBranchForm.get('infrastructure') as FormArray;
    }

    addRoomType() {
        this.infrastructure.push(this.fb.group({
            roomType: [''],
            number: ['']
        }));
    }

    /**
     * Load branch infrastructure from API
     */
    loadBranchInfrastructure() {
        if (!this.childBranchId) return;

        this.childBranchService.getChildBranchInfrastructure(this.childBranchId).subscribe({
            next: (infra) => {
                // Clear existing infrastructure
                while (this.infrastructure.length !== 0) {
                    this.infrastructure.removeAt(0);
                }

                // Add infrastructure to form
                if (infra && infra.length > 0) {
                    infra.forEach((item: any) => {
                        this.infrastructure.push(this.fb.group({
                            roomType: [item.type || ''],
                            number: [item.count || '']
                        }));
                    });
                } else {
                    // If no infrastructure, add one empty row
                    this.infrastructure.push(this.fb.group({
                        roomType: [''],
                        number: ['']
                    }));
                }
            },
            error: (error) => {
                console.error('Error loading branch infrastructure:', error);
                // On error, ensure at least one empty row exists
                if (this.infrastructure.length === 0) {
                    this.infrastructure.push(this.fb.group({
                        roomType: [''],
                        number: ['']
                    }));
                }
            }
        });
    }

    onSubmit() {
        if (this.childBranchForm.invalid || !this.childBranchId) return;

        this.isSubmitting = true;
        const formValue = this.childBranchForm.value;
        let establishedOn = formValue.establishedOn;

        if (establishedOn) {
            establishedOn = new Date(establishedOn).toISOString();
        }

        const updateData: Partial<ChildBranchPayload> = {
            name: formValue.name,
            email: formValue.email,
            contact_number: formValue.contactNumber,
            established_on: establishedOn,
            aashram_area: parseFloat(formValue.ashramArea) || 0,
            country_id: parseInt(formValue.country),
            state_id: parseInt(formValue.state),
            city_id: parseInt(formValue.city),
            address: formValue.address,
            pincode: formValue.pincode,
            post_office: formValue.postOffice,
            police_station: formValue.thana || '',
            open_days: formValue.openDays || '',
            daily_start_time: formValue.dailyStartTime || '',
            daily_end_time: formValue.dailyEndTime || '',
            branch_code: formValue.branchCode || ''
        };

        this.childBranchService.updateChildBranch(this.childBranchId, updateData).subscribe({
            next: () => {
                // Prepare infrastructure array from form
                // Use the FormArray directly to get the most up-to-date values
                const infrastructureArray: any[] = [];
                const infraFormArray = this.infrastructure;
                
                for (let i = 0; i < infraFormArray.length; i++) {
                    const infraGroup = infraFormArray.at(i);
                    const roomTypeValue = infraGroup.get('roomType')?.value;
                    const numberValue = infraGroup.get('number')?.value;
                    
                    if (roomTypeValue && roomTypeValue.trim() !== '') {
                        let count = 0;
                        if (numberValue !== null && numberValue !== undefined && numberValue !== '') {
                            if (typeof numberValue === 'string') {
                                count = parseInt(numberValue.trim(), 10);
                            } else {
                                count = Number(numberValue);
                            }
                            if (isNaN(count)) {
                                count = 0;
                            }
                        }
                        infrastructureArray.push({
                            type: roomTypeValue.trim(),
                            count: count
                        });
                    }
                }

                // Get existing infrastructure to delete and recreate
                this.childBranchService.getChildBranchInfrastructure(this.childBranchId!).subscribe({
                    next: (existingInfra) => {
                        // Delete all existing infrastructure
                        let deletedCount = 0;
                        if (existingInfra && existingInfra.length > 0) {
                            existingInfra.forEach((infra) => {
                                if (infra.id) {
                                    this.childBranchService.deleteChildBranchInfrastructure(infra.id).subscribe({
                                        next: () => {
                                            deletedCount++;
                                            if (deletedCount === existingInfra.length) {
                                                this.createNewInfrastructure(infrastructureArray);
                                            }
                                        },
                                        error: (err) => {
                                            console.error('Error deleting infrastructure:', err);
                                            deletedCount++;
                                            if (deletedCount === existingInfra.length) {
                                                this.createNewInfrastructure(infrastructureArray);
                                            }
                                        }
                                    });
                                } else {
                                    deletedCount++;
                                }
                            });
                        } else {
                            this.createNewInfrastructure(infrastructureArray);
                        }
                    },
                    error: (err) => {
                        console.error('Error fetching existing infrastructure:', err);
                        // Still try to create new infrastructure
                        this.createNewInfrastructure(infrastructureArray);
                    }
                });
            },
            error: (error) => {
                console.error('Error updating child branch:', error);
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update child branch' });
                this.isSubmitting = false;
            }
        });
    }

    createNewInfrastructure(infrastructureArray: any[]) {
        if (infrastructureArray.length === 0) {
            this.showSuccessAndRedirect();
            return;
        }

        let infrastructureCreated = 0;
        let infrastructureErrors = 0;
        
        infrastructureArray.forEach((infra) => {
            this.childBranchService.createChildBranchInfrastructure(this.childBranchId!, {
                type: infra.type,
                count: infra.count
            }).subscribe({
                next: () => {
                    infrastructureCreated++;
                    if (infrastructureCreated + infrastructureErrors === infrastructureArray.length) {
                        if (infrastructureErrors > 0) {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Partial Success',
                                detail: `Child branch updated, but ${infrastructureErrors} infrastructure entry(ies) failed to save.`,
                                life: 5000
                            });
                        }
                        this.showSuccessAndRedirect();
                    }
                },
                error: (error) => {
                    console.error('Error creating infrastructure:', error);
                    infrastructureErrors++;
                    if (infrastructureCreated + infrastructureErrors === infrastructureArray.length) {
                        if (infrastructureErrors > 0) {
                            this.messageService.add({
                                severity: 'warn',
                                summary: 'Partial Success',
                                detail: `Child branch updated, but ${infrastructureErrors} infrastructure entry(ies) failed to save.`,
                                life: 5000
                            });
                        }
                        this.showSuccessAndRedirect();
                    }
                }
            });
        });
    }

    showSuccessAndRedirect() {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Child branch updated successfully!' });
        this.isSubmitting = false;
        setTimeout(() => this.router.navigate(['/branch']), 1500);
    }

    cancel() {
        this.router.navigate(['/branch']);
    }
}

