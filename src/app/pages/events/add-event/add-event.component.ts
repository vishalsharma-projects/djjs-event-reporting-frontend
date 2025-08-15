// import { Component, OnInit } from '@angular/core';
// import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-add-event',
//   templateUrl: './add-event.component.html',
//   styleUrls: ['./add-event.component.scss']
// })
// export class AddEventComponent implements OnInit {

//   currentStep = 1;
//   totalSteps = 3;

//   // Form data for different steps
//   generalDetailsForm: FormGroup;
//   mediaPromotionForm: FormGroup;
//   involvedParticipantsForm: FormGroup;

//   // Dynamic arrays for additional items
//   donationTypes: any[] = [{ type: 'Cash', amount: '', description: '' }];
//   materialTypes: any[] = [{ type: '', quantity: '', size: '', description: '' }];
//   specialGuests: any[] = [];
//   volunteers: any[] = [];

//   // File upload data
//   uploadedFiles: any = {
//     eventPhotos: [],
//     videoCoverage: '',
//     pressRelease: [],
//     testimonials: []
//   };

//   // Dropdown options
//   eventTypes = ['Spiritual', 'Cultural', 'Educational', 'Social Service', 'Others'];
//   kathaTypes = ['Bhagwat Katha', 'Ram Katha', 'Mahabharat Katha', 'Other'];
//   scales = ['Small (S)', 'Medium (M)', 'Large (L)'];
//   languages = ['Hindi', 'English', 'Sanskrit', 'Gujarati', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];
//   countries = ['India', 'USA', 'UK', 'Canada', 'Australia'];
//   states = ['Karnataka', 'Maharashtra', 'Delhi', 'Uttar Pradesh', 'Gujarat', 'Tamil Nadu'];
//   cities = ['Bangalore', 'Mumbai', 'Delhi', 'Lucknow', 'Ahmedabad', 'Chennai'];
//   addressTypes = ['Residential', 'Commercial', 'Temple', 'Community Center', 'Other'];
//   donationTypeOptions = ['Cash', 'In-kind', 'Bank Transfer', 'Cheque'];
//   mediaCoverageTypes = ['Print', 'Digital', 'TV', 'Radio', 'Social Media'];
//   materialTypeOptions = ['Banner', 'Pamphlet', 'Poster', 'Social Media Post', 'TV Advertisement'];
//   materialSizes = ['Small', 'Medium', 'Large', 'Custom'];
//   prefixes = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Shri', 'Smt.'];
//   sevaTypes = ['Event Management', 'Catering', 'Decoration', 'Transportation', 'Registration', 'Other'];

//   constructor(
//     private fb: FormBuilder,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     this.initializeForms();
//   }

//   initializeForms(): void {
//     // General Details Form - removed validators
//     this.generalDetailsForm = this.fb.group({
//       eventType: ['Spiritual'],
//       eventName: ['Katha'],
//       kathaType: ['Bhagwat Katha'],
//       scale: [''],
//       theme: [''],
//       language: [''],
//       duration: [''],
//       dailyStartTime: [''],
//       dailyEndTime: [''],
//       spiritualOrator: [''],
//       country: [''],
//       pincode: [''],
//       postOffice: ['Karnataka'],
//       thana: [''],
//       tehsil: [''],
//       state: ['Karnataka'],
//       city: ['Bangalore'],
//       addressType: [''],
//       address: [''],
//       prachar: [['Area 1', 'Area 2']],
//       areaCovered: ['0.00'],
//       donationType: ['Cash'],
//       cashAmount: [''],
//       inKindType: [''],
//       inKindItems: [['Rice 5kg', 'bed-sheet - 2']],
//       estimatedAmount: [''],
//       akhandGyan: [''],
//       sellAmount: ['']
//     });

//     // Media & Promotion Form - removed validators
//     this.mediaPromotionForm = this.fb.group({
//       mediaCoverageType: [''],
//       organizationName: [''],
//       mediaEmail: [''],
//       mediaWebsite: [''],
//       prefix: [''],
//       firstName: [''],
//       middleName: [''],
//       lastName: [''],
//       designation: [''],
//       contact: [''],
//       email: [''],
//       referenceBranchId: [''],
//       referenceMemberId: [''],
//       referencePersonName: ['--------'],
//       materialType: [''],
//       quantity: [''],
//       size: [''],
//       eventPhotos: [''],
//       videoCoverage: [''],
//       pressRelease: [''],
//       testimonials: ['']
//     });

//     // Involved Participants Form - removed validators
//     this.involvedParticipantsForm = this.fb.group({
//       specialGuests: this.fb.array([]),
//       beneficiariesMen: [0],
//       beneficiariesWomen: [0],
//       beneficiariesChildren: [0],
//       initiationMen: [0],
//       initiationWomen: [0],
//       initiationChildren: [0],
//       volunteers: this.fb.array([])
//     });
//   }

//   // Add donation type functionality
//   addDonationType(): void {
//     this.donationTypes.push({ type: 'Cash', amount: '', description: '' });
//   }

//   removeDonationType(index: number): void {
//     if (this.donationTypes.length > 1) {
//       this.donationTypes.splice(index, 1);
//     }
//   }

//   // Add material type functionality
//   addMaterialType(): void {
//     this.materialTypes.push({ type: '', quantity: '', size: '', description: '' });
//   }

//   removeMaterialType(index: number): void {
//     if (this.materialTypes.length > 1) {
//       this.materialTypes.splice(index, 1);
//     }
//   }

//   // Add special guest functionality
//   addSpecialGuest(): void {
//     this.specialGuests.push({
//       gender: '',
//       prefix: '',
//       firstName: '',
//       middleName: '',
//       lastName: '',
//       designation: '',
//       organization: '',
//       email: '',
//       contact: '',
//       contactPerson: ''
//     });
//   }

//   removeSpecialGuest(index: number): void {
//     this.specialGuests.splice(index, 1);
//   }

//   // Add volunteer functionality
//   addVolunteer(): void {
//     this.volunteers.push({
//       name: '',
//       days: 0,
//       seva: ''
//     });
//   }

//   removeVolunteer(index: number): void {
//     this.volunteers.splice(index, 1);
//   }

//   // File upload functionality
//   onFileSelected(event: any, fileType: string): void {
//     const files = event.target.files;
//     if (files && files.length > 0) {
//       if (fileType === 'eventPhotos' || fileType === 'pressRelease' || fileType === 'testimonials') {
//         this.uploadedFiles[fileType] = Array.from(files);
//       } else {
//         this.uploadedFiles[fileType] = files[0];
//       }
//       console.log(`${fileType} files uploaded:`, this.uploadedFiles[fileType]);
//     }
//   }

//   // Video coverage input
//   onVideoCoverageChange(event: any): void {
//     this.uploadedFiles.videoCoverage = event.target.value;
//   }

//   nextStep(): void {
//     if (this.currentStep < this.totalSteps) {
//       this.currentStep++;
//     }
//   }

//   previousStep(): void {
//     if (this.currentStep > 1) {
//       this.currentStep--;
//     }
//   }

//   goToStep(step: number): void {
//     this.currentStep = step;
//   }

//   // Removed validation check - always allow navigation
//   isStepValid(step: number): boolean {
//     return true; // Always return true to allow navigation
//   }

//   onSubmit(): void {
//     if (this.currentStep === this.totalSteps) {
//       // Collect all form data
//       const formData = {
//         generalDetails: this.generalDetailsForm.value,
//         mediaPromotion: this.mediaPromotionForm.value,
//         involvedParticipants: this.involvedParticipantsForm.value,
//         donationTypes: this.donationTypes,
//         materialTypes: this.materialTypes,
//         specialGuests: this.specialGuests,
//         volunteers: this.volunteers,
//         uploadedFiles: this.uploadedFiles
//       };

//       // Console all details as requested
//       console.log('=== EVENT FORM COMPLETE DATA ===');
//       console.log('General Details:', formData.generalDetails);
//       console.log('Media & Promotion:', formData.mediaPromotion);
//       console.log('Involved Participants:', formData.involvedParticipants);
//       console.log('Donation Types:', formData.donationTypes);
//       console.log('Material Types:', formData.materialTypes);
//       console.log('Special Guests:', formData.specialGuests);
//       console.log('Volunteers:', formData.volunteers);
//       console.log('Uploaded Files:', formData.uploadedFiles);
//       console.log('=== END OF FORM DATA ===');

//       // Navigate back to events list
//       this.router.navigate(['/events']);
//     } else {
//       this.nextStep();
//     }
//   }

//   goBack(): void {
//     this.router.navigate(['/events']);
//   }
// }
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-event',
  templateUrl: './add-event.component.html',
  styleUrls: ['./add-event.component.scss']
})
export class AddEventComponent implements OnInit {

  currentStep = 1;
  totalSteps = 3;

  // Form data for different steps
  generalDetailsForm: FormGroup;
  mediaPromotionForm: FormGroup;
  involvedParticipantsForm: FormGroup;

  // Dynamic arrays for additional items
  donationTypes: any[] = [{ type: 'Cash', amount: '', description: '' }];
  materialTypes: any[] = [{ type: '', quantity: '', size: '', description: '' }];
  specialGuests: any[] = [];
  volunteers: any[] = [];

  // File upload data
  uploadedFiles: any = {
    eventPhotos: [],
    videoCoverage: '',
    pressRelease: [],
    testimonials: []
  };

  // Dropdown options
  eventTypes = ['Spiritual', 'Cultural', 'Educational', 'Social Service', 'Others'];
  
  // Event names based on event type
  eventNamesByType: { [key: string]: string[] } = {
    'Spiritual': [
      'Bhagwat Katha',
      'Ram Katha', 
      'Mahabharat Katha',
      'Shiv Puran Katha',
      'Devi Bhagwat Katha',
      'Hanuman Chalisa Path',
      'Satsang',
      'Spiritual Discourse',
      'Meditation Session',
      'Prayer Meeting'
    ],
    'Cultural': [
      'Cultural Festival',
      'Dance Performance',
      'Music Concert',
      'Drama/Theatre',
      'Art Exhibition',
      'Literature Meet',
      'Folk Dance',
      'Classical Music',
      'Poetry Recitation'
    ],
    'Educational': [
      'Educational Seminar',
      'Workshop',
      'Training Program',
      'Conference',
      'Skill Development',
      'Career Guidance',
      'Academic Competition',
      'Science Fair',
      'Book Fair'
    ],
    'Social Service': [
      'Blood Donation Camp',
      'Health Check-up Camp',
      'Tree Plantation',
      'Cleanliness Drive',
      'Food Distribution',
      'Clothes Distribution',
      'Educational Support',
      'Disaster Relief',
      'Community Service'
    ],
    'Others': [
      'Community Gathering',
      'Sports Event',
      'Youth Meet',
      'Senior Citizen Meet',
      'Anniversary Celebration',
      'Foundation Day',
      'Inauguration',
      'Award Ceremony',
      'General Meeting'
    ]
  };

  // Katha types based on event name
  kathaTypesByEventName: { [key: string]: string[] } = {
    'Bhagwat Katha': [
      'Bhagwat Puran Katha',
      'Shrimad Bhagwat Katha',
      'Bhagwat Gita Katha',
      'Krishna Leela Katha'
    ],
    'Ram Katha': [
      'Ramayan Katha',
      'Ram Charitra Katha',
      'Tulsi Ramayan',
      'Valmiki Ramayan',
      'Hanuman Katha'
    ],
    'Mahabharat Katha': [
      'Mahabharat Puran',
      'Gita Mahabharat',
      'Pandav Katha',
      'Krishna Mahabharat'
    ],
    'Shiv Puran Katha': [
      'Shiv Mahima Katha',
      'Shiv Charitra',
      'Rudra Katha',
      'Mahadev Katha'
    ],
    'Devi Bhagwat Katha': [
      'Durga Katha',
      'Mata Rani Katha',
      'Devi Mahatmya',
      'Navratri Katha'
    ],
    'Hanuman Chalisa Path': [
      'Hanuman Chalisa Paath',
      'Sundarkand Path',
      'Hanuman Mahima',
      'Bajrang Baan Path'
    ],
    'Satsang': [
      'Spiritual Satsang',
      'Bhajan Satsang',
      'Kirtan Satsang',
      'Gyan Satsang'
    ],
    'Spiritual Discourse': [
      'Dharma Pravachan',
      'Spiritual Talk',
      'Religious Discourse',
      'Vedic Teaching'
    ],
    'Meditation Session': [
      'Guided Meditation',
      'Silent Meditation',
      'Group Meditation',
      'Yoga & Meditation'
    ],
    'Prayer Meeting': [
      'Group Prayer',
      'Evening Prayer',
      'Morning Prayer',
      'Special Prayer'
    ]
  };

  // Available options based on selections
  availableEventNames: string[] = [];
  availableKathaTypes: string[] = [];

  scales = ['Small (S)', 'Medium (M)', 'Large (L)'];
  languages = ['Hindi', 'English', 'Sanskrit', 'Gujarati', 'Marathi', 'Bengali', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'];
  countries = ['India', 'USA', 'UK', 'Canada', 'Australia'];
  states = ['Karnataka', 'Maharashtra', 'Delhi', 'Uttar Pradesh', 'Gujarat', 'Tamil Nadu'];
  cities = ['Bangalore', 'Mumbai', 'Delhi', 'Lucknow', 'Ahmedabad', 'Chennai'];
  addressTypes = ['Residential', 'Commercial', 'Temple', 'Community Center', 'Other'];
  donationTypeOptions = ['Cash', 'In-kind', 'Bank Transfer', 'Cheque'];
  mediaCoverageTypes = ['Print', 'Digital', 'TV', 'Radio', 'Social Media'];
  materialTypeOptions = ['Banner', 'Pamphlet', 'Poster', 'Social Media Post', 'TV Advertisement'];
  materialSizes = ['Small', 'Medium', 'Large', 'Custom'];
  prefixes = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'Shri', 'Smt.'];
  sevaTypes = ['Event Management', 'Catering', 'Decoration', 'Transportation', 'Registration', 'Other'];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeForms();
    this.setupFormValueChanges();
  }

  initializeForms(): void {
    // General Details Form
    this.generalDetailsForm = this.fb.group({
      eventType: [''],
      eventName: [''],
      kathaType: [''],
      scale: [''],
      theme: [''],
      language: [''],
      duration: [''],
      dailyStartTime: [''],
      dailyEndTime: [''],
      spiritualOrator: [''],
      country: [''],
      pincode: [''],
      postOffice: ['Karnataka'],
      thana: [''],
      tehsil: [''],
      state: ['Karnataka'],
      city: ['Bangalore'],
      addressType: [''],
      address: [''],
      prachar: [['Area 1', 'Area 2']],
      areaCovered: ['0.00'],
      donationType: ['Cash'],
      cashAmount: [''],
      inKindType: [''],
      inKindItems: [['Rice 5kg', 'bed-sheet - 2']],
      estimatedAmount: [''],
      akhandGyan: [''],
      sellAmount: ['']
    });

    // Media & Promotion Form
    this.mediaPromotionForm = this.fb.group({
      mediaCoverageType: [''],
      organizationName: [''],
      mediaEmail: [''],
      mediaWebsite: [''],
      prefix: [''],
      firstName: [''],
      middleName: [''],
      lastName: [''],
      designation: [''],
      contact: [''],
      email: [''],
      referenceBranchId: [''],
      referenceMemberId: [''],
      referencePersonName: ['--------'],
      materialType: [''],
      quantity: [''],
      size: [''],
      eventPhotos: [''],
      videoCoverage: [''],
      pressRelease: [''],
      testimonials: ['']
    });

    // Involved Participants Form
    this.involvedParticipantsForm = this.fb.group({
      specialGuests: this.fb.array([]),
      beneficiariesMen: [0],
      beneficiariesWomen: [0],
      beneficiariesChildren: [0],
      initiationMen: [0],
      initiationWomen: [0],
      initiationChildren: [0],
      volunteers: this.fb.array([])
    });
  }

  setupFormValueChanges(): void {
    // Listen for event type changes
    this.generalDetailsForm.get('eventType')?.valueChanges.subscribe(eventType => {
      this.onEventTypeChange(eventType);
    });

    // Listen for event name changes
    this.generalDetailsForm.get('eventName')?.valueChanges.subscribe(eventName => {
      this.onEventNameChange(eventName);
    });
  }

  onEventTypeChange(eventType: string): void {
    // Reset dependent fields
    this.generalDetailsForm.patchValue({
      eventName: '',
      kathaType: ''
    });

    // Update available event names
    this.availableEventNames = this.eventNamesByType[eventType] || [];
    this.availableKathaTypes = [];
  }

  onEventNameChange(eventName: string): void {
    // Reset katha type
    this.generalDetailsForm.patchValue({
      kathaType: ''
    });

    // Update available katha types
    this.availableKathaTypes = this.kathaTypesByEventName[eventName] || [];
    
    // If no katha types available for this event name, hide the katha type field
    if (this.availableKathaTypes.length === 0) {
      this.availableKathaTypes = [];
    }
  }

  // Check if katha type field should be visible
  shouldShowKathaType(): boolean {
    const eventType = this.generalDetailsForm.get('eventType')?.value;
    const eventName = this.generalDetailsForm.get('eventName')?.value;
    
    // Show katha type only for spiritual events with specific event names
    return eventType === 'Spiritual' && this.availableKathaTypes.length > 0;
  }

  // Add donation type functionality
  addDonationType(): void {
    this.donationTypes.push({ type: 'Cash', amount: '', description: '' });
  }

  removeDonationType(index: number): void {
    if (this.donationTypes.length > 1) {
      this.donationTypes.splice(index, 1);
    }
  }

  // Add material type functionality
  addMaterialType(): void {
    this.materialTypes.push({ type: '', quantity: '', size: '', description: '' });
  }

  removeMaterialType(index: number): void {
    if (this.materialTypes.length > 1) {
      this.materialTypes.splice(index, 1);
    }
  }

  // Add special guest functionality
  addSpecialGuest(): void {
    this.specialGuests.push({
      gender: '',
      prefix: '',
      firstName: '',
      middleName: '',
      lastName: '',
      designation: '',
      organization: '',
      email: '',
      contact: '',
      contactPerson: ''
    });
  }

  removeSpecialGuest(index: number): void {
    this.specialGuests.splice(index, 1);
  }

  // Add volunteer functionality
  addVolunteer(): void {
    this.volunteers.push({
      name: '',
      days: 0,
      seva: ''
    });
  }

  removeVolunteer(index: number): void {
    this.volunteers.splice(index, 1);
  }

  // File upload functionality
  onFileSelected(event: any, fileType: string): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (fileType === 'eventPhotos' || fileType === 'pressRelease' || fileType === 'testimonials') {
        this.uploadedFiles[fileType] = Array.from(files);
      } else {
        this.uploadedFiles[fileType] = files[0];
      }
      console.log(`${fileType} files uploaded:`, this.uploadedFiles[fileType]);
    }
  }

  // Video coverage input
  onVideoCoverageChange(event: any): void {
    this.uploadedFiles.videoCoverage = event.target.value;
  }

  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  isStepValid(step: number): boolean {
    return true;
  }

  onSubmit(): void {
    if (this.currentStep === this.totalSteps) {
      // Collect all form data
      const formData = {
        generalDetails: this.generalDetailsForm.value,
        mediaPromotion: this.mediaPromotionForm.value,
        involvedParticipants: this.involvedParticipantsForm.value,
        donationTypes: this.donationTypes,
        materialTypes: this.materialTypes,
        specialGuests: this.specialGuests,
        volunteers: this.volunteers,
        uploadedFiles: this.uploadedFiles
      };

      console.log('=== EVENT FORM COMPLETE DATA ===');
      console.log('General Details:', formData.generalDetails);
      console.log('Media & Promotion:', formData.mediaPromotion);
      console.log('Involved Participants:', formData.involvedParticipants);
      console.log('Donation Types:', formData.donationTypes);
      console.log('Material Types:', formData.materialTypes);
      console.log('Special Guests:', formData.specialGuests);
      console.log('Volunteers:', formData.volunteers);
      console.log('Uploaded Files:', formData.uploadedFiles);
      console.log('=== END OF FORM DATA ===');

      this.router.navigate(['/events']);
    } else {
      this.nextStep();
    }
  }

  goBack(): void {
    this.router.navigate(['/events']);
  }
}