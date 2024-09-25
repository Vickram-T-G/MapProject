'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

//parent for the Workout:
class Workout {
  date = new Date();
  //we need an ID (similar to wt happend in BANIST proj)
  //there v had an array of objs and from there v used find/findIndex method to find the user which mathches the PIN
  //but this only works if v want to search something like the account owner using a PIN
  //so that is a bad PRACTICE
  //so every obj should have UNIQUE identifies to identify them (so in big Projects v use libraries for that)
  //but here v simple use Dates (and get the last 10 nos as strings)
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat,lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

//child of Workout:
class Running extends Workout {
  type = 'running';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription(); //i didnt use a private class as because, private class cant be access on the child classes
  }

  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //km/hr
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}
class App {
  #map;
  #mapZoomLevel = 15;
  #mapEvent;
  #workouts = [];
  constructor() {
    // Get user's position
    this.#getPosition();

    // Get data from local storage
    this.#getLocalStorage();

    // ATTACH EVENT HANDLERS
    //this constructor will be triggered immediately after v create an obj using this class
    //so when v create a class v also display the map immediately:
    //this.#getPosition();
    //also v attach an event listner that gives us a form when we click the map
    //form.addEventListener('submit', this.#newWorkout);
    //here the this will be attached to FORM as for eventHandler funct this is the element in which the DOM element is attachd to

    form.addEventListener('submit', this.#newWorkout.bind(this));
    //SO ALWAYS USE bind to add methods into a event listners and while perfoming other methods in a methods
    //as the this will be defined DIFFERENTLY than what we expect

    inputType.addEventListener('change', this.#toggleElevationField);

    //adding event listner on the parent of the form as the workout forms will not be rendered during the inital state of the application
    //so v take advantage of the EVENT delegation and add the eventlistner to the parent
    containerWorkouts.addEventListener('click', this.#moveToPopup.bind(this));
  }

  #getPosition() {
    if (navigator.geolocation)
      //navigator.geolocation.getCurrentPosition(this.#loadMap, function () {
      //now here this.#loadMap will be called by this getCurrentPosition AS A REGULAR FUNCTION CALL(not as a method call) so this here will be undefined
      navigator.geolocation.getCurrentPosition(
        this.#loadMap.bind(this),
        function () {
          //now here WE R CALLING the BIND method(as a method) on the VARIABLE which is using(ie the CURRENT OBJ)
          //so v r setting that this to be the this of the #loadMap
          //JS will call this.#loadMap and pass the position argument as soon as the user's position is determined
          alert('Could not get your Location');
        }
      );
  }

  #loadMap(position) {
    //console.log(position);
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    // console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#initialMarker(position);

    //Handling clicks on map:
    this.#map.on('click', this.#showForm.bind(this));

    // Adding marker even the page is re-loaded
    this.#workouts.forEach(work => {
      this.#renderWorkoutMarker(work);
    });
  }

  #initialMarker(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];

    // this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    L.marker(coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnclick: false,
        })
      )
      .setOpacity(0)
      .setPopupContent('You are Near here Right Now')
      .openPopup();
  }

  #showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  #hideForm() {
    //clear input fields
    inputCadence.value =
      inputDistance.value =
      inputDuration.value =
      inputElevation.value =
        '';
    //removing the animation of form sliding:
    form.style.display = 'none';
    form.classList.add('hidden');
    //adding the animation after v insert back the workout obj in the form
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  #toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }

  #newWorkout(e) {
    const validInputs = (
      ...inputs //here ...inputs will be an array
    ) => inputs.every(inp => Number.isFinite(inp));

    const allPositive = (...inputs) => inputs.every(inp => inp > 0);
    e.preventDefault();

    // Get data from the form
    const type = inputType.value; //inputType is a select element
    //we get its value from the value represented i HTML
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if workout running then create a running obj
    if (type === 'running') {
      const cadence = +inputCadence.value;
      // check if the data is valid
      if (
        //   !Number.isFinite(distance) ||
        //   !Number.isFinite(duration) ||
        //   !Number.isFinite(cadence)
        // )
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration, cadence)
      )
        return alert('Inputs have to be positive numbers!');

      workout = new Running([lat, lng], distance, duration, cadence);
    }
    // if workout is cycling, creata a cycling obj
    if (type === 'cycling') {
      const elevation = +inputElevation.value;
      // check if the data is valid
      if (
        !validInputs(distance, duration, cadence) ||
        !allPositive(distance, duration)
      ) {
        //here the elevation can be -ve
        return alert('Inputs have to be positive numbers!');
      }
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    // Add new obj to workout array
    this.#workouts.push(workout);

    // Render workout on map as a marker
    this.#renderWorkoutMarker(workout);

    // Render workout on List
    this.#renderWorkout(workout);

    // Hide form + clear input fields
    this.#hideForm();

    // Set local Storage to all workouts
    this.#setLocalStorage();
  }

  #renderWorkoutMarker(workout) {
    //display marker
    //console.log(lat, lng);
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,

          closeOnclick: false,
          className: `${workout.type}-popup`, //used to get the green/orange border depinding upon on the type
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`
      )
      .openPopup();
  }

  #renderWorkout(workout) {
    //data-id here is a custom data attribute
    //we normally use them to create a bridge between User Interface and the data in our application
    const html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
          <h2 class="workout__title">Running on April 14</h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.name === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;

    if (workout.type === 'running')
      html += `
         <div class="workout__details">
           <span class="workout__icon">⚡️</span>
           <span class="workout__value">${workout.pace.toFixed(1)}</span>
           <span class="workout__unit">min/km</span>
          </div>
         <div class="workout__details">
           <span class="workout__icon">🦶🏼</span>
             <span class="workout__value">${workout.cadence}</span>
           <span class="workout__unit">spm</span>
         </div>
       </li>
            `;

    if (workout.type === 'cycling')
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elevationGain}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
            `;
    form.insertAdjacentHTML('afterend', html);
  }

  #moveToPopup(e) {
    //now v have to match the obj v click on
    const workoutEl = e.target.closest('.workout');
    //e.target is the element v click on and from there v get the closest parent named workout

    if (!workoutEl) return;
    const workout = this.#workouts.find(
      work => work.id === workoutEl.dataset.id
    );
    //moving to the area of the map the workout is in
    //we use predefinded method from leaflet
    //parameters --- coordinate, zoom, object of options
    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  #setLocalStorage() {
    // localStorage is an api that browser provides us
    // parameter --- anyName(this is the keyName), string we want to store(which should be associated with the KEY NAME v give)
    // so local storage is a basic key-value storage so v use it only for small projs
    // we convert objs to string using JSON.stringify
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  #getLocalStorage() {
    //even when we refresh v get the stored data

    //these data stored in LocalStorage will be stored in the url of the browser
    //converting strings back to obj(it will return as ARRAY of OBJs)
    // so when v convert an obj to string and back to obj ALL THE
    // PROTOCHAIN v maintained on the obj will be LOST
    //THEY WILL NOT BE THE OBJs created by the classes/nor the child/parent elements of something
    const data = JSON.parse(localStorage.getItem('workouts'));

    if (!data) return;
    //setting the workouts when we refresh again
    this.#workouts = data;
    //also rendering all the workouts and the markers:
    this.#workouts.forEach(work => {
      this.#renderWorkout(work);
      //we cant just add the markers directly as the map will not be loaded when v reload the page at the starting
      //so when the constructor is called at the start and goes to #renderWorkoutMarker it will be trying to add a marker on a MAP
      //which doesnt exist so:
      //this.#renderWorkoutMarker(work) WILL NOT WORK
      //so v load the marker after the map is loaded so v add it in the #loadMap
    });
  }

  // method to delete all the element in the local storage:
  reset() {
    localStorage.removeItem('workouts');
    //also reloading the page after removing:
    location.reload();
    //again location is a big obj from the browser that has tons of methods
  }
}
const app = new App();

/*
let map, mapEvent;

//checking if the API exist on the browser:
if (navigator.geolocation) {
  //GeoLocation API is just an browser API like internationalization timer etc
  navigator.geolocation.getCurrentPosition(
    function (position) {
      //the Position Parameter
      const { latitude } = position.coords;
      //same as: const latitude = position.coords.latitude
      //this here creates an const named as latitude getting the element from position.coords obj
      const { longitude } = position.coords;
      //now using a google-maps url and setting this to current latitude and longitude
      //so that it takes us to the current location
      console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);

      const coords = [latitude, longitude];
      //const map = L.map('map').setView([51.505, -0.09], 13);
      map = L.map('map').setView(coords, 13);
      //here the SECOND argument is the ZOOM LEVEL of the MAP

      //here the string we pass in is the ID name of the element where we wish to display our map
      //L is the MAINFUNCTION gives that LEAFLET gives us as a entry point
      //it is like the namespace like Intl (for intranatialization)
      //so L has couple of Methods like map,tileLayer etc
      //this L variable will be available in both script and the console
      //as L is a global variable declared in LEAFLET and we call LEAFLET before script.js in HTML
      //so EVERY GLOBAL VARIABLE in any script will be available to all the other scripts in the same folder
      //as long as they APPEAR after that script in HTML
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        //the map we see is made of SMALL parts called TILES (which u can see while the map loads)
        //these tiles comes from openstreetmap(which is an OPEN-SOURCE map that users can use)
        //so if we google and get NEW STYLES for these tiles v can change the style of MAP v see
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // L.marker(coords)
      //   .addTo(map)
      //   .bindPopup('A pretty CSS popup.<br> Easily customizable.')
      //   .openPopup();

      //to get the coordinate when we click on a map we shuld:
      //adding event listner to the MAP element display on the page will not worK
      //so v use method given IN the LEAFLET library:
      map.on('click', function (mapE) {
        mapEvent = mapE;
        //L.market creates the marker
        //.addTo adds the marker
        //creates a bindPopup creates a popup v want on that area and bind its to the map
        //instead of having string(in bindPopup) we will have and obj which will have some options

        //HANDLING clicks on map
        //WHEN A CLICK on the map happens we have to show the form
        form.classList.remove('hidden');
        //to increase user experience:
        //when a click on the map happens v keep the cursor at the DISTANCE box
        inputDistance.focus();
      });
    },
    function () {
      //will be called during an Error
      alert(`Could not get Your Position`);
    }
  );
  //1st Parameter --- call back function that will be called on SUCCESS --- known as Positon Parameter
  //so when the browser gets the location 1st funcn will be called
  //2nd Parameter --- call back function that will be called we get an ERROR
}

//adding the POP-up when we have a submit
//although v dont have a submit button as v r having FORM element
//when the user clicks enter the Submit will be called
form.addEventListener('submit', function (e) {
  e.preventDefault();
  //Clearing Input Fields:
  inputDistance.value =
    inputCadence.value =
    inputDuration.value =
    inputElevation.value =
      '';

  //Displaying Marker after the form
  //adding the marker:
  const { lat, lng } = mapEvent.latlng;
  L.marker([lat, lng])
    .addTo(map)
    .bindPopup(
      L.popup({
        //setting size to the pop-up:
        maxWidth: 250,
        minWidth: 100,
        //changing the default behaviour of closing the pop-up when another pop-up is opened
        autoClose: false,
        //preventing popup from closing whenever the user click on the map:
        closeOnclick: false,
        className: 'running-popup',
        //className --- used to give any css Class name v want

        //setting the string ON THE POP-UP
      })
    )
    .setPopupContent('Workout')
    .openPopup();
});
//so when we change to cycling to running in the SELECT element an event is triggered
//so acc to that event we change the Cadence box to Elevation box:
inputType().addEventListener('change', function () {
  //closest selects us the closest PARENT of the element
  //so v toggle between Cadence Box and Elevent box (parent) so that they can be hidden and visible
  inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
});
*/
