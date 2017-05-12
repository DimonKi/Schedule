/**
 * remaining time
 * start
 */

function remaining_time(start_time) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();
  const hours = start_time.split(':')[0];
  const minutes = start_time.split(':')[1];

  moment.locale('ru');
  document.getElementById('remaining-time').textContent = moment(new Date(year, month, day, hours, minutes, 0, 0)).fromNow()
}

document.querySelectorAll('.single-event').forEach(item => {
  item.addEventListener('click', remaining_time.bind(item, item.getAttribute('data-start')))
});

/**
 * remaining time
 * end
 */


/**
 * aside menu
 * start
 */

new mlPushMenu(document.getElementById('mp-menu'), document.getElementById('trigger'));

/**
 * aside menu
 * end
 */


/**
 * search address
 * start
 */

function codeLatLng(lat, lng) {
  const latlng = new google.maps.LatLng(lat, lng);
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({
    'latLng': latlng
  }, function (results, status) {
    if (status === google.maps.GeocoderStatus.OK) {
      if (results[1]) {
        document.getElementById('place-output').textContent = results[1].formatted_address;
      } else {
        alert('Не удалось определить местоположение автоматически, введите свой адрес');
      }
    } else {
      alert('Geocoder failed due to: ' + status);
    }
  });
}

function initAutocomplete() {
  navigator.geolocation.getCurrentPosition(
    function (position) {
      window.currentLocation = position.coords.latitude + ', ' + position.coords.longitude;
      codeLatLng(position.coords.latitude, position.coords.longitude)
    },
    function (error) {
      console.log(error);
    },
    {
      enableHighAccuracy: true,
      timeout: Infinity,
      maximumAge: 0
    }
  );

  const output = document.getElementById('place-output');
  const input = document.getElementById('place-input');
  const searchBox = new google.maps.places.SearchBox(input);

  searchBox.addListener('places_changed', function () {
    const places = searchBox.getPlaces();
    output.textContent = places[0].formatted_address;

    window.currentLocation = places[0].geometry.location.lat() + ', ' + places[0].geometry.location.lng();

    if (places.length === 0) {
      return
    }
  });
}

/**
 * search address
 * end
 */


/**
 * route
 * start
 */

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
  // 53.7092727, 23.854585600000064
  directionsService.route({
    origin: window.currentLocation,
    destination: window.destinationLocation,
    travelMode: 'TRANSIT',
  }, function (response, status) {
    if (status === 'OK') {
      directionsDisplay.setDirections(response);
      document.getElementById('distance').textContent = response.routes[0].legs[0].distance.text;
      document.getElementById('duration').textContent = response.routes[0].legs[0].duration.text;
    } else {
      directionsService.route({
        origin: window.currentLocation,
        destination: window.destinationLocation,
        travelMode: 'DRIVING',
      }, function (response, status) {
        if (status === 'OK') {
          directionsDisplay.setDirections(response);
        } else {
          window.alert('Маршрут не найден. ' + status);
        }
      });
    }
  });
}

function initMap() {
  navigator.geolocation.getCurrentPosition(function (position) {
    const currentLocation = [position.coords.latitude, position.coords.longitude];

    const directionsService = new google.maps.DirectionsService;
    const directionsDisplay = new google.maps.DirectionsRenderer;
    const map = new google.maps.Map(document.getElementById('map'), {
      zoom: 11,
      center: {
        lat: currentLocation[0],
        lng: currentLocation[1]
      }
    });
    directionsDisplay.setMap(map);

    calculateAndDisplayRoute(directionsService, directionsDisplay);
  });
}

document.querySelectorAll('.single-event').forEach(item => {
  item.addEventListener('click', initMap)
});

/**
 * route
 * end
 */

jQuery(document).ready(function ($) {
  let transitionEnd = 'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend';
  const transitionsSupported = ( $('.csstransitions').length > 0 );
  //if browser does not support transitions - use a different event to trigger them
  if (!transitionsSupported) transitionEnd = 'noTransition';

  //should add a loding while the events are organized

  function SchedulePlan(element) {
    this.element = element;
    this.timeline = this.element.find('.timeline');
    this.timelineItems = this.timeline.find('li');
    this.timelineItemsNumber = this.timelineItems.length;
    this.timelineStart = getScheduleTimestamp(this.timelineItems.eq(0).text());
    //need to store delta (in our case half hour) timestamp
    this.timelineUnitDuration = getScheduleTimestamp(this.timelineItems.eq(1).text()) - getScheduleTimestamp(this.timelineItems.eq(0).text());

    this.eventsWrapper = this.element.find('.events');
    this.eventsGroup = this.eventsWrapper.find('.events-group');
    this.singleEvents = this.eventsGroup.find('.single-event');
    this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();

    this.modal = this.element.find('.event-modal');
    this.modalHeader = this.modal.find('.header');
    this.modalHeaderBg = this.modal.find('.header-bg');
    this.modalBody = this.modal.find('.body');
    this.modalBodyBg = this.modal.find('.body-bg');
    this.modalMaxWidth = 800;
    this.modalMaxHeight = 480;

    this.animating = false;

    this.initSchedule();
  }

  SchedulePlan.prototype.initSchedule = function () {
    this.scheduleReset();
    this.initEvents();
  };

  SchedulePlan.prototype.scheduleReset = function () {
    const mq = this.mq();
    if (mq === 'desktop' && !this.element.hasClass('js-full')) {
      //in this case you are on a desktop version (first load or resize from mobile)
      this.eventSlotHeight = this.eventsGroup.eq(0).children('.top-info').outerHeight();
      this.element.addClass('js-full');
      this.placeEvents();
      this.element.hasClass('modal-is-open') && this.checkEventModal();
    } else if (mq === 'mobile' && this.element.hasClass('js-full')) {
      //in this case you are on a mobile version (first load or resize from desktop)
      this.element.removeClass('js-full loading');
      this.eventsGroup.children('ul').add(this.singleEvents).removeAttr('style');
      this.eventsWrapper.children('.grid-line').remove();
      this.element.hasClass('modal-is-open') && this.checkEventModal();
    } else if (mq === 'desktop' && this.element.hasClass('modal-is-open')) {
      //on a mobile version with modal open - need to resize/move modal window
      this.checkEventModal('desktop');
      this.element.removeClass('loading');
    } else {
      this.element.removeClass('loading');
    }
  };

  SchedulePlan.prototype.initEvents = function () {
    const self = this;

    this.singleEvents.each(function () {
      //create the .event-date element for each event
      const durationLabel = '<span class="event-date">' + $(this).data('start') + ' - ' + $(this).data('end') + '</span>';
      $(this).children('a').prepend($(durationLabel));

      //detect click on the event and open the modal
      $(this).on('click', 'a', function (event) {
        event.preventDefault();
        window.destinationLocation = $(this).parent().attr('data-university');
        if (!self.animating) self.openModal($(this))
      });
    });

    //close modal window
    this.modal.on('click', '.close', function (event) {
      event.preventDefault();
      if (!self.animating) self.closeModal(self.eventsGroup.find('.selected-event'));
    });
    this.element.on('click', '.cover-layer', function (event) {
      if (!self.animating && self.element.hasClass('modal-is-open')) self.closeModal(self.eventsGroup.find('.selected-event'));
    });
  };

  SchedulePlan.prototype.placeEvents = function () {
    const self = this;
    this.singleEvents.each(function () {
      //place each event in the grid -> need to set top position and height
      const start = getScheduleTimestamp($(this).attr('data-start')),
        duration = getScheduleTimestamp($(this).attr('data-end')) - start;

      const eventTop = self.eventSlotHeight * (start - self.timelineStart) / self.timelineUnitDuration,
        eventHeight = self.eventSlotHeight * duration / self.timelineUnitDuration;

      $(this).css({
        top: (eventTop - 1) + 'px',
        height: (eventHeight + 1) + 'px'
      });
    });

    this.element.removeClass('loading');
  };

  SchedulePlan.prototype.openModal = function (event) {
    const self = this;
    const mq = self.mq();
    this.animating = true;

    //update event name and time
    this.modalHeader.find('.event-name').text(event.find('.event-name').text());
    this.modalHeader.find('.event-date').text(event.find('.event-date').text());
    this.modal.attr('data-event', event.parent().attr('data-event'));

    //update event content
    this.modalBody.find('.event-info').load(event.parent().attr('data-content') + '.html .event-info > *', function () {
      //once the event content has been loaded
      self.element.addClass('content-loaded');
    });

    this.element.addClass('modal-is-open');

    setTimeout(function () {
      //fixes a flash when an event is selected - desktop version only
      event.parent('li').addClass('selected-event');
    }, 10);

    if (mq === 'mobile') {
      self.modal.one(transitionEnd, function () {
        self.modal.off(transitionEnd);
        self.animating = false;
      });
    } else {
      const
        eventTop = event.offset().top - $(window).scrollTop(),
        eventLeft = event.offset().left,
        eventHeight = event.innerHeight(),
        eventWidth = event.innerWidth();

      const
        windowWidth = $(window).width(),
        windowHeight = $(window).height();

      const
        modalWidth = ( windowWidth * .8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth * .8,
        modalHeight = ( windowHeight * .8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight * .8;

      const
        modalTranslateX = parseInt((windowWidth - modalWidth) / 2 - eventLeft),
        modalTranslateY = parseInt((windowHeight - modalHeight) / 2 - eventTop);

      const
        HeaderBgScaleY = modalHeight / eventHeight,
        BodyBgScaleX = (modalWidth - eventWidth);

      //change modal height/width and translate it
      self.modal.css({
        top: eventTop + 'px',
        left: eventLeft + 'px',
        height: modalHeight + 'px',
        width: modalWidth + 'px',
      });
      transformElement(self.modal, 'translateY(' + modalTranslateY + 'px) translateX(' + modalTranslateX + 'px)');

      //set modalHeader width
      self.modalHeader.css({
        width: eventWidth + 'px',
      });
      //set modalBody left margin
      self.modalBody.css({
        marginLeft: eventWidth + 'px',
      });

      //change modalBodyBg height/width ans scale it
      self.modalBodyBg.css({
        height: eventHeight + 'px',
        width: '1px',
      });
      transformElement(self.modalBodyBg, 'scaleY(' + HeaderBgScaleY + ') scaleX(' + BodyBgScaleX + ')');

      //change modal modalHeaderBg height/width and scale it
      self.modalHeaderBg.css({
        height: eventHeight + 'px',
        width: eventWidth + 'px',
      });
      transformElement(self.modalHeaderBg, 'scaleY(' + HeaderBgScaleY + ')');

      self.modalHeaderBg.one(transitionEnd, function () {
        //wait for the  end of the modalHeaderBg transformation and show the modal content
        self.modalHeaderBg.off(transitionEnd);
        self.animating = false;
        self.element.addClass('animation-completed');
      });
    }

    //if browser do not support transitions -> no need to wait for the end of it
    if (!transitionsSupported) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
  };

  SchedulePlan.prototype.closeModal = function (event) {
    const self = this;
    const mq = self.mq();

    this.animating = true;

    if (mq === 'mobile') {
      this.element.removeClass('modal-is-open');
      this.modal.one(transitionEnd, function () {
        self.modal.off(transitionEnd);
        self.animating = false;
        self.element.removeClass('content-loaded');
        event.removeClass('selected-event');
      });
    } else {
      const eventTop = event.offset().top - $(window).scrollTop(),
        eventLeft = event.offset().left,
        eventHeight = event.innerHeight(),
        eventWidth = event.innerWidth();

      const modalTop = Number(self.modal.css('top').replace('px', '')),
        modalLeft = Number(self.modal.css('left').replace('px', ''));

      const modalTranslateX = eventLeft - modalLeft,
        modalTranslateY = eventTop - modalTop;

      self.element.removeClass('animation-completed modal-is-open');

      //change modal width/height and translate it
      this.modal.css({
        width: eventWidth + 'px',
        height: eventHeight + 'px'
      });
      transformElement(self.modal, 'translateX(' + modalTranslateX + 'px) translateY(' + modalTranslateY + 'px)');

      //scale down modalBodyBg element
      transformElement(self.modalBodyBg, 'scaleX(0) scaleY(1)');
      //scale down modalHeaderBg element
      transformElement(self.modalHeaderBg, 'scaleY(1)');

      this.modalHeaderBg.one(transitionEnd, function () {
        //wait for the  end of the modalHeaderBg transformation and reset modal style
        self.modalHeaderBg.off(transitionEnd);
        self.modal.addClass('no-transition');
        setTimeout(function () {
          self.modal.add(self.modalHeader).add(self.modalBody).add(self.modalHeaderBg).add(self.modalBodyBg).attr('style', '');
        }, 10);
        setTimeout(function () {
          self.modal.removeClass('no-transition');
        }, 20);

        self.animating = false;
        self.element.removeClass('content-loaded');
        event.removeClass('selected-event');
      });
    }

    //browser do not support transitions -> no need to wait for the end of it
    if (!transitionsSupported) self.modal.add(self.modalHeaderBg).trigger(transitionEnd);
  };

  SchedulePlan.prototype.mq = function () {
    //get MQ value ('desktop' or 'mobile')
    return window.getComputedStyle(this.element.get(0), '::before').getPropertyValue('content').replace(/["']/g, '');
  };

  SchedulePlan.prototype.checkEventModal = function () {
    this.animating = true;
    const self = this;
    const mq = this.mq();

    if (mq === 'mobile') {
      //reset modal style on mobile
      self.modal.add(self.modalHeader).add(self.modalHeaderBg).add(self.modalBody).add(self.modalBodyBg).attr('style', '');
      self.modal.removeClass('no-transition');
      self.animating = false;
    } else if (mq === 'desktop' && self.element.hasClass('modal-is-open')) {
      self.modal.addClass('no-transition');
      self.element.addClass('animation-completed');
      const event = self.eventsGroup.find('.selected-event');

      const
        eventHeight = event.innerHeight(),
        eventWidth = event.innerWidth();

      const windowWidth = $(window).width(),
        windowHeight = $(window).height();

      const modalWidth = ( windowWidth * .8 > self.modalMaxWidth ) ? self.modalMaxWidth : windowWidth * .8,
        modalHeight = ( windowHeight * .8 > self.modalMaxHeight ) ? self.modalMaxHeight : windowHeight * .8;

      const HeaderBgScaleY = modalHeight / eventHeight,
        BodyBgScaleX = (modalWidth - eventWidth);

      setTimeout(function () {
        self.modal.css({
          width: modalWidth + 'px',
          height: modalHeight + 'px',
          top: (windowHeight / 2 - modalHeight / 2) + 'px',
          left: (windowWidth / 2 - modalWidth / 2) + 'px',
        });
        transformElement(self.modal, 'translateY(0) translateX(0)');
        //change modal modalBodyBg height/width
        self.modalBodyBg.css({
          height: modalHeight + 'px',
          width: '1px',
        });
        transformElement(self.modalBodyBg, 'scaleX(' + BodyBgScaleX + ')');
        //set modalHeader width
        self.modalHeader.css({
          width: eventWidth + 'px',
        });
        //set modalBody left margin
        self.modalBody.css({
          marginLeft: eventWidth + 'px',
        });
        //change modal modalHeaderBg height/width and scale it
        self.modalHeaderBg.css({
          height: eventHeight + 'px',
          width: eventWidth + 'px',
        });
        transformElement(self.modalHeaderBg, 'scaleY(' + HeaderBgScaleY + ')');
      }, 10);

      setTimeout(function () {
        self.modal.removeClass('no-transition');
        self.animating = false;
      }, 20);
    }
  };

  let schedules = $('.cd-schedule');
  const objSchedulesPlan = [];
  let windowResize = false;

  if (schedules.length > 0) {
    schedules.each(function () {
      objSchedulesPlan.push(new SchedulePlan($(this)));
    });
  }

  $(window).on('resize', function () {
    if (!windowResize) {
      windowResize = true;
      (!window.requestAnimationFrame) ? setTimeout(checkResize) : window.requestAnimationFrame(checkResize);
    }
  });

  $(window).keyup(function (event) {
    if (event.keyCode === 27) {
      objSchedulesPlan.forEach(function (element) {
        element.closeModal(element.eventsGroup.find('.selected-event'));
      });
    }
  });

  function checkResize() {
    objSchedulesPlan.forEach(function (element) {
      element.scheduleReset();
    });
    windowResize = false;
  }

  function getScheduleTimestamp(time) {
    //accepts hh:mm format - convert hh:mm to timestamp
    time = time.replace(/ /g, '');
    const timeArray = time.split(':');
    return parseInt(timeArray[0]) * 60 + parseInt(timeArray[1]);
  }

  function transformElement(element, value) {
    element.css({
      'transform': value
    });
  }
});
