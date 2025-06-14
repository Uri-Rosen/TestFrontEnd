document.addEventListener('DOMContentLoaded', function() {
  const SERVER_BASE_URL = 'https://hairformation-backend.onrender.com';

  const haircutTypeSelect = document.getElementById('haircutType');
  const baseServiceSelect = document.getElementById('baseService');
  const addonsContainer = document.getElementById('additionalServices');
  const addonCheckboxes = document.querySelectorAll('.addon-checkbox');
  const dateInput = document.getElementById('date');
  const timeSelect = document.getElementById('time');
  const bookingForm = document.getElementById('bookingForm');
  const submitBtn = document.getElementById('submitBtn');

  let allServicesData = [];

  const ALLOWED_SERVICE_KEYS = new Set([
    'mens_cut',
    'mens_cut_beard',
    'womens_cut',
    'blow_dry',
    'color_regular',
    'color_inoa',
    'color_regular_womens_cut',
    'color_inoa_womens_cut',
    'color_regular_blow_dry',
    'color_inoa_blow_dry',
    'color_regular_womens_cut_blow_dry',
    'color_inoa_womens_cut_blow_dry',
    'ampule',
    'ampule_blow_dry',
    'color_regular_ampule',
    'color_inoa_ampule',
    'color_regular_ampule_blow_dry',
    'color_inoa_ampule_blow_dry',
    'color_regular_ampule_womens_cut',
    'color_inoa_ampule_womens_cut',
    'gvanim',
    'keratin'
  ]);

  function mapServiceKey(base, addons) {
    const set = new Set(addons);
    let candidate = '';
    if (base === 'color_regular' || base === 'color_inoa') {
      const prefix = base;
      if (set.has('ampule') && set.has('womens_cut') && set.has('blow_dry')) {
        candidate = '';
      } else if (set.has('ampule') && set.has('womens_cut')) {
        candidate = `${prefix}_ampule_womens_cut`;
      } else if (set.has('ampule') && set.has('blow_dry')) {
        candidate = `${prefix}_ampule_blow_dry`;
      } else if (set.has('womens_cut') && set.has('blow_dry')) {
        candidate = `${prefix}_womens_cut_blow_dry`;
      } else if (set.has('ampule')) {
        candidate = `${prefix}_ampule`;
      } else if (set.has('womens_cut')) {
        candidate = `${prefix}_womens_cut`;
      } else if (set.has('blow_dry')) {
        candidate = `${prefix}_blow_dry`;
      } else {
        candidate = prefix;
      }
    } else if (base === 'ampule') {
      if (set.has('blow_dry')) candidate = 'ampule_blow_dry';
      else candidate = 'ampule';
    } else if (base === 'mens_cut') {
      if (set.has('beard_trim')) candidate = 'mens_cut_beard';
      else candidate = 'mens_cut';
    } else {
      candidate = base;
    }
    return ALLOWED_SERVICE_KEYS.has(candidate) ? candidate : '';
  }

  function updateServiceKey(changedCb) {
    const base = baseServiceSelect.value;
    const addons = Array.from(addonCheckboxes).filter(c => c.checked).map(c => c.value);
    let key = base ? mapServiceKey(base, addons) : '';
    if (base && key === '' && changedCb) {
      changedCb.checked = false;
      const validAddons = Array.from(addonCheckboxes).filter(c => c.checked).map(c => c.value);
      key = mapServiceKey(base, validAddons);
    }
    haircutTypeSelect.value = key;
  }

  async function loadServices() {
    try {
      const response = await fetch(`${SERVER_BASE_URL}/services`);
      if (!response.ok) {
        throw new Error(`[loadServices] HTTP error! status: ${response.status}`);
      }
      allServicesData = await response.json();

      const currentServiceValue = haircutTypeSelect.value;

      haircutTypeSelect.innerHTML = '<option value="">בחרו סוג שירות</option>';
      allServicesData.forEach(service => {
        const option = document.createElement('option');
        option.value = service.key;
        option.textContent = service.hebrewName;
        option.dataset.bookableOnline = service.bookableOnline;
        option.dataset.isManualTimeSelection = service.isManualTimeSelection;
        if (service.manualBookingMessage) {
            option.dataset.manualBookingMessage = service.manualBookingMessage;
        }
        haircutTypeSelect.appendChild(option);
      });

      if (currentServiceValue) {
        haircutTypeSelect.value = currentServiceValue;
      }
      console.log('[loadServices] Services loaded and populated into select.');
    } catch (error) {
      console.error("[loadServices] Failed to load services:", error);
      showValidationError(haircutTypeSelect, 'שגיאה בטעינת סוגי השירותים. נסו לרענן את הדף.');
      haircutTypeSelect.innerHTML = '<option value="">שגיאה בטעינת שירותים</option>';
    }
  }

  $('#date').datepicker({
    format: 'yyyy-mm-dd',
    language: 'he',
    orientation: 'bottom left',
    weekStart: 0, // Sunday
    daysOfWeekDisabled: [1, 6], // Monday, Saturday
    autoclose: true,
    startDate: new Date(),
    todayHighlight: true,
    rtl: true
  }).on('changeDate', function(e) {
    if (e.date) {
        const formattedDate = formatDate(e.date);
        if(dateInput.value !== formattedDate) dateInput.value = formattedDate;

        removeValidationError(dateInput);
        loadAvailableTimes(dateInput.value);
    } else {
        timeSelect.innerHTML = '<option value="">נא לבחור תאריך</option>';
    }
  });

  baseServiceSelect.addEventListener('change', function() {
    const baseVal = baseServiceSelect.value;
    const beardDiv = document.getElementById('addonBeardTrim')?.parentElement;
    const ampuleDiv = document.getElementById('addonAmpule')?.parentElement;
    const womensDiv = document.getElementById('addonWomensCut')?.parentElement;
    const blowDiv = document.getElementById('addonBlowDry')?.parentElement;

    addonCheckboxes.forEach(c => c.checked = false);
    beardDiv.style.display = 'none';
    ampuleDiv.style.display = 'none';
    womensDiv.style.display = 'none';
    blowDiv.style.display = 'none';

    if (baseVal === 'mens_cut') {
      addonsContainer.style.display = 'block';
      beardDiv.style.display = 'block';
    } else if (baseVal === 'color_regular' || baseVal === 'color_inoa') {
      addonsContainer.style.display = 'block';
      ampuleDiv.style.display = 'block';
      womensDiv.style.display = 'block';
      blowDiv.style.display = 'block';
    } else if (baseVal === 'ampule') {
      addonsContainer.style.display = 'block';
      blowDiv.style.display = 'block';
    } else {
      addonsContainer.style.display = 'none';
    }
    updateServiceKey();
    haircutTypeSelect.dispatchEvent(new Event('change'));
  });

  addonCheckboxes.forEach(cb => cb.addEventListener('change', () => {
    updateServiceKey(cb);
    haircutTypeSelect.dispatchEvent(new Event('change'));
  }));

  haircutTypeSelect.addEventListener('change', function() {
    removeValidationError(baseServiceSelect);
    const selectedOption = haircutTypeSelect.options[haircutTypeSelect.selectedIndex];

    timeSelect.innerHTML = '<option value="">בחרו תאריך ושירות</option>';

    if (selectedOption && selectedOption.value) {
      const isBookableOnline = selectedOption.dataset.bookableOnline === 'true';
      const isManualTimeSelection = selectedOption.dataset.isManualTimeSelection === 'true';

      if (!isBookableOnline && isManualTimeSelection) {
        submitBtn.textContent = 'שלחו הודעה בוואטסאפ';
        submitBtn.classList.remove('btn-primary');
        submitBtn.classList.add('btn-success');
      } else if (isBookableOnline) {
        submitBtn.textContent = 'קבעו תור';
        submitBtn.classList.remove('btn-success');
        submitBtn.classList.add('btn-primary');
      } else {
        submitBtn.textContent = 'בחרו שירות';
        submitBtn.classList.remove('btn-success');
        submitBtn.classList.add('btn-primary');
      }

      if (dateInput.value && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.value)) {
          loadAvailableTimes(dateInput.value);
      }
    } else {
        submitBtn.textContent = 'קבעו תור';
        submitBtn.classList.remove('btn-success');
        submitBtn.classList.add('btn-primary');
    }
  });

  timeSelect.addEventListener('change', function() {
    removeValidationError(timeSelect);
  });

  async function loadAvailableTimes(dateStr) {
    const serviceKey = haircutTypeSelect.value;
    const selectedOption = haircutTypeSelect.options[haircutTypeSelect.selectedIndex];

    if (!selectedOption || !serviceKey) {
        timeSelect.innerHTML = '<option value="">בחרו סוג שירות קודם</option>';
        return;
    }

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        timeSelect.innerHTML = '<option value="">נא לבחור תאריך תקין</option>';
        return;
    }

    timeSelect.innerHTML = '<option value="">טוען זמנים...</option>';
    try {
      const requestBody = { date: dateStr, serviceKey: serviceKey };
      const response = await fetch(`${SERVER_BASE_URL}/get-availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.error || `שגיאת שרת: ${response.status}. נסו שוב.`;
        showValidationError(timeSelect, errorMsg);
        timeSelect.innerHTML = `<option value="">${errorMsg}</option>`;
        return;
      }

      // Handle case where Gvanim/Keratin on Friday might return empty slots with original message
      // The server already handles not returning slots, but client can show a more specific message if desired
      const dateObj = new Date(dateStr + 'T00:00:00'); // Ensure it's parsed as local
      const dayOfWeek = dateObj.getDay(); // Sunday is 0, Saturday is 6

      if (dayOfWeek === 5 && (serviceKey === 'gvanim' || serviceKey === 'keratin')) {
          timeSelect.innerHTML = `<option value="">${selectedOption.dataset.manualBookingMessage || 'שירות זה אינו זמין בימי שישי.'}</option>`;
          
          return;
      }
      
      if (data.error && !(data.isManualTimeSelection && data.availableSlots)) {
        showValidationError(timeSelect, data.error);
        timeSelect.innerHTML = `<option value="">${data.error}</option>`;
        return;
      }

      const isManualService = data.isManualTimeSelection === true || String(data.isManualTimeSelection) === "true";
      const slots = data.availableSlots || [];

      if (slots.length === 0) {
        if (isManualService && data.manualBookingMessage) {
            timeSelect.innerHTML = `<option value="">${data.manualBookingMessage.includes("שעה משוערת") ? "אין זמנים משוערים פנויים. עדיין ניתן לשלוח הודעה כללית." : data.manualBookingMessage}</option>`;
        } else {
            timeSelect.innerHTML = '<option value="">אין שעות פנויות בתאריך זה</option>';
        }
      } else {
        timeSelect.innerHTML = `<option value="">בחרו שעה${isManualService ? " (משוערת)" : ""}</option>`;
        slots.forEach(t => {
          const option = document.createElement('option');
          option.value = t;
          option.textContent = t;
          timeSelect.appendChild(option);
        });
      }
      removeValidationError(timeSelect);
    } catch (err) {
      console.error("[loadAvailableTimes] Fetch/Network error:", err);
      showValidationError(timeSelect, 'שגיאה בטעינת הזמנים. בדקו את חיבור האינטרנט ונסו שוב.');
      timeSelect.innerHTML = '<option value="">שגיאה בטעינת זמנים</option>';
    }
  }

  bookingForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    if (!validateForm()) {
      const firstError = document.querySelector('.is-invalid, .form-control.error-field');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const serviceKey = haircutTypeSelect.value;
    const selectedOptionElement = haircutTypeSelect.options[haircutTypeSelect.selectedIndex];
    const isBookableOnline = selectedOptionElement.dataset.bookableOnline === 'true';
    const isManualTimeSelection = selectedOptionElement.dataset.isManualTimeSelection === 'true';
    const hebrewServiceName = selectedOptionElement.textContent;

    const date = dateInput.value;
    const time = timeSelect.value;
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phone = document.getElementById('phone').value.trim();

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> שולח...';

    if (isManualTimeSelection) {
      const baseWhatsappUrl = 'https://api.whatsapp.com/send';
      const barbershopPhoneNumber = '972547224551';
      let textMessage = `היי, שמי ${firstName} ${lastName} ואשמח לקבוע תור ל${hebrewServiceName}.`;
      if (date) textMessage += ` בתאריך ${date}`;

      if (time && timeSelect.options.length > 0 && timeSelect.value !== "" && time !== timeSelect.options[0].value ) {
          textMessage += ` בסביבות השעה ${time}`;
      } else if (date) {
          textMessage += ` (שעה תיקבע טלפונית)`;
      }
      textMessage += `. מספר הטלפון שלי הוא ${phone}.`;

      window.open(`${baseWhatsappUrl}?phone=${barbershopPhoneNumber}&text=${encodeURIComponent(textMessage)}`, '_blank');
      alert("הודעת הוואטסאפ מוכנה לשליחה! אנא שלחו את ההודעה כדי להשלים את הבקשה.");

      bookingForm.reset();
      $('#date').datepicker('update', '');
      timeSelect.innerHTML = '<option value="">בחרו תאריך ושירות</option>';
      haircutTypeSelect.value = "";
      goToStep(0);

      submitBtn.disabled = false;
      submitBtn.textContent = 'קבעו תור';
      submitBtn.classList.remove('btn-success');
      submitBtn.classList.add('btn-primary');
      return;
    }

    if (isBookableOnline) {
        try {
          const finalCheckRequestBody = { date, serviceKey };
          const finalCheckRes = await fetch(`${SERVER_BASE_URL}/get-availability`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalCheckRequestBody)
          });
          const finalCheckData = await finalCheckRes.json();

          if (!finalCheckRes.ok || !finalCheckData.availableSlots || !finalCheckData.availableSlots.includes(time)) {
            alert("אופס! נראה שהשעה שבחרת כבר נתפסה או שאינה זמינה עוד. אנא בחרו שעה אחרת.");
            loadAvailableTimes(date);
            goToStep(2);
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'קבעו תור';
            return;
          }

          const bookRequestBody = { serviceKey, date, time, clientName: `${firstName} ${lastName}`, clientPhone: phone };
          const response = await fetch(`${SERVER_BASE_URL}/book-appointment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookRequestBody)
          });
          const data = await response.json();

          if (!response.ok || data.error) {
            const errorDetail = data.error || `שגיאה ${response.status}.`;
            showValidationError(submitBtn, `לא ניתן לקבוע את התור: ${errorDetail}. נסו שעה אחרת או צרו קשר.`);
          } else {
            const appointmentDetails = {
              clientName: `${firstName} ${lastName}`,
              date,
              time,
              serviceName: hebrewServiceName
            };
            localStorage.setItem('appointmentDetails', JSON.stringify(appointmentDetails));
            window.location.href = '../confirmation/';
          }
        } catch (err) {
          console.error("[bookingForm submit] Booking error:", err);
          showValidationError(submitBtn, 'התרחשה שגיאה בקביעת התור. אנא נסו שוב מאוחר יותר או צרו קשר.');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'קבעו תור';
        }
    } else {
        console.error("Error: Service is neither bookable online nor manual time selection.");
        showValidationError(submitBtn, "שגיאה בהגדרת השירות. אנא צרו קשר עם המספרה.");
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'קבעו תור';
    }
  });

  const phonePattern = /^(05\d|0\d|07\d|02|03|04|08|09)\d{7,8}$/;
  const namePattern = /^[A-Za-zא-תĀ-ž\s'-]+$/u;

  function validateForm() {
    let isValid = true;
    const existingFormError = bookingForm.querySelector('.form-error-general');
    if (existingFormError) existingFormError.remove();

    const selectedOption = haircutTypeSelect.options[haircutTypeSelect.selectedIndex];
    if (!baseServiceSelect.value || !selectedOption || selectedOption.value === "") {
      showValidationError(baseServiceSelect, 'אנא בחרו סוג שירות.');
      isValid = false;
    } else {
      removeValidationError(baseServiceSelect);
    }

    const isBookableOnline = selectedOption ? selectedOption.dataset.bookableOnline === 'true' : false;
    if (selectedOption && selectedOption.value !== "") {
        if (!dateInput.value) {
            showValidationError(dateInput, 'אנא בחרו תאריך.');
            isValid = false;
        } else {
            removeValidationError(dateInput);
        }
    }

    if (isBookableOnline) {
      if (!timeSelect.value || timeSelect.value === "") {
        showValidationError(timeSelect, 'אנא בחרו שעה.');
        isValid = false;
      } else {
        removeValidationError(timeSelect);
      }
    } else {
        removeValidationError(timeSelect);
    }


    const firstNameInput = document.getElementById('firstName');
    if (!firstNameInput.value.trim()) {
      showValidationError(firstNameInput, 'אנא הזינו שם פרטי.');
      isValid = false;
    } else if (!namePattern.test(firstNameInput.value.trim())) {
      showValidationError(firstNameInput, 'השם הפרטי יכול להכיל אותיות, רווחים ומקפים.');
      isValid = false;
    } else {
      removeValidationError(firstNameInput);
    }

    const lastNameInput = document.getElementById('lastName');
    if (!lastNameInput.value.trim()) {
      showValidationError(lastNameInput, 'אנא הזינו שם משפחה.');
      isValid = false;
    } else if (!namePattern.test(lastNameInput.value.trim())) {
      showValidationError(lastNameInput, 'שם המשפחה יכול להכיל אותיות, רווחים ומקפים.');
      isValid = false;
    } else {
      removeValidationError(lastNameInput);
    }

    const phoneInput = document.getElementById('phone');
    if (!phoneInput.value.trim()) {
      showValidationError(phoneInput, 'אנא הזינו מספר טלפון.');
      isValid = false;
    } else if (!phonePattern.test(phoneInput.value.trim())) {
      showValidationError(phoneInput, 'מספר טלפון לא תקין (לדוגמה: 0501234567).');
      isValid = false;
    } else {
      removeValidationError(phoneInput);
    }
    return isValid;
  }

  function showValidationError(inputElement, message) {
    if (!inputElement || inputElement.type === 'submit' || inputElement.id === 'submitBtn') {
        let formError = bookingForm.querySelector('.form-error-general');
        if (!formError) {
            formError = document.createElement('div');
            formError.className = 'form-error-general alert alert-danger mt-3';
            formError.setAttribute('role', 'alert');
            const progressBarElement = document.querySelector('.progress');
            if (progressBarElement && progressBarElement.parentNode) {
                progressBarElement.parentNode.insertBefore(formError, progressBarElement.nextSibling);
            } else {
                bookingForm.prepend(formError);
            }
        }
        formError.textContent = message;
        formError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    inputElement.classList.add('is-invalid');
    inputElement.classList.add('error-field');

    let feedback = inputElement.parentElement.querySelector('.invalid-feedback');
    if (inputElement.parentNode.classList.contains('input-group')) {
        feedback = inputElement.parentNode.parentNode.querySelector('.invalid-feedback');
         if (!feedback) {
            feedback = document.createElement('div');
            feedback.className = 'invalid-feedback';
            inputElement.parentNode.parentNode.appendChild(feedback);
        }
    } else {
        if (!feedback) {
          feedback = document.createElement('div');
          feedback.className = 'invalid-feedback';
          inputElement.parentElement.appendChild(feedback);
        }
    }
    feedback.textContent = message;
    feedback.style.display = 'block';
  }

  function removeValidationError(inputElement) {
    if (inputElement) {
      inputElement.classList.remove('is-invalid');
      inputElement.classList.remove('error-field');

      let feedbackElement;
      if (inputElement.parentNode.classList.contains('input-group')) {
          feedbackElement = inputElement.parentNode.parentNode.querySelector('.invalid-feedback');
      } else {
          feedbackElement = inputElement.parentElement.querySelector('.invalid-feedback');
      }

      if (feedbackElement) {
        feedbackElement.textContent = '';
        feedbackElement.style.display = 'none';
      }
    }
    const existingFormError = bookingForm.querySelector('.form-error-general');
    if (existingFormError) existingFormError.remove();
  }

  const steps = Array.from(document.querySelectorAll('.step'));
  const progressBar = document.querySelector('.progress-bar');
  const totalFormSteps = steps.length;

  function updateProgressBar(currentStepZeroIndexed) {
    const currentStepOneIndexed = currentStepZeroIndexed + 1;
    const percentage = (currentStepOneIndexed / totalFormSteps) * 100;
    progressBar.style.width = `${percentage}%`;
    progressBar.setAttribute('aria-valuenow', currentStepOneIndexed);
    progressBar.textContent = `${currentStepOneIndexed}/${totalFormSteps}`;
  }

  function goToStep(stepZeroIndexed) {
    steps.forEach((step, index) => {
      step.classList.toggle('active', index === stepZeroIndexed);
    });
    updateProgressBar(stepZeroIndexed);
    const activeStepElement = steps[stepZeroIndexed];

    if (activeStepElement) {
        if (stepZeroIndexed === 1) { // Step 2: Date selection
            // Check if datepicker is initialized and not already visible
            if ($('#date').data('datepicker') && !$('#date').data('datepicker').picker.is(":visible")) {
                 setTimeout(() => { // Timeout ensures the step is rendered before showing picker
                    $('#date').datepicker('show');
                 }, 50); // Small delay
            }
        } else {
            // For other steps, scroll into view if not the first step
            if (stepZeroIndexed > 0) {
                setTimeout(() => {
                     activeStepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }
  }

  document.getElementById('prevBtn-2')?.addEventListener('click', () => goToStep(0));
  document.getElementById('nextBtn-1')?.addEventListener('click', () => {
    if (validateSingleStepInputs(steps[0])) goToStep(1);
  });
  document.getElementById('prevBtn-3')?.addEventListener('click', () => goToStep(1));
  document.getElementById('nextBtn-2')?.addEventListener('click', () => {
    if (validateSingleStepInputs(steps[1])) goToStep(2);
  });
  document.getElementById('prevBtn-4')?.addEventListener('click', () => goToStep(2));
  document.getElementById('nextBtn-3')?.addEventListener('click', () => {
    if (validateSingleStepInputs(steps[2])) goToStep(3);
  });

  document.getElementById('nextBtn-4')?.addEventListener('click', () => {
    if(validateSingleStepInputs(steps[3])) goToStep(4);
  });

  document.getElementById('prevBtn-5')?.addEventListener('click', () => goToStep(3));
  document.getElementById('nextBtn-5')?.addEventListener('click', () => {
    if(validateSingleStepInputs(steps[4])) goToStep(5);
  });

  document.getElementById('prevBtn-6')?.addEventListener('click', () => goToStep(4));

  function validateSingleStepInputs(stepElement) {
    let stepIsValid = true;
    const inputsToValidate = stepElement.querySelectorAll('input[required], select[required]');

    inputsToValidate.forEach(input => {
        let currentInputValid = true;
        const labelElement = stepElement.querySelector(`label[for="${input.id}"]`);
        const fieldName = labelElement ? labelElement.textContent.replace(':', '').trim() : 'שדה זה';
        const errorMessageBase = `אנא מלאו ${fieldName}.`;

        if (!input.value.trim()) {
            showValidationError(input, errorMessageBase);
            currentInputValid = false;
        } else {
            if (input.id === 'firstName' || input.id === 'lastName') {
                if (!namePattern.test(input.value.trim())) {
                    showValidationError(input, `השדה ${fieldName} יכול להכיל אותיות (עברית/אנגלית), רווחים ומקפים.`);
                    currentInputValid = false;
                } else { removeValidationError(input); }
            } else if (input.id === 'phone') {
                if (!phonePattern.test(input.value.trim())) {
                    showValidationError(input, 'מספר טלפון לא תקין (לדוגמה: 0501234567).');
                    currentInputValid = false;
                } else { removeValidationError(input); }
            } else {
                removeValidationError(input);
            }
        }
        if (!currentInputValid) stepIsValid = false;
    });
    return stepIsValid;
  }


  function formatDate(dateObj) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadServices().then(() => {
    updateServiceKey();
  });
  goToStep(0);
});
