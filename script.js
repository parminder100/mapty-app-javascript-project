
const form = document.querySelector('form');
const workoutContainer = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");



class Workout{
    date = new Date;
    id = (Date.now() + '').slice(-10);

    constructor(coords, distance, duration){
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _setDescription(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
    }

}

class Running extends Workout{
    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.type = 'running';
        this.cadence = cadence;
        this.calcPace();
        this._setDescription();
    }

    calcPace(){
        this.pace = this.duration / this.distance;
        return this.pace;
    }
}

class Cycling extends Workout{
    constructor(coords, distance, duration, elevation){
        super(coords, distance, duration);
        this.type = 'cycling';
        this.elevation = elevation;
        this.calcSpeed();
        this._setDescription();
    }

    calcSpeed(){
        this.speed = this.distance / this.duration / 60
        return this.speed;
    }
}


class App{
    #map;
    #mapEvent;
    #workouts = [];
    #mapZoomLevel = 13;
    constructor(){
        this._getLocalStorage();
        this._getUserPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._toggleElevationField.bind(this));
        workoutContainer.addEventListener('click', this._movePopupToMarker.bind(this));
    }

    _getUserPosition(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this),function(){
                alert('coords not found');
            });
        }
    }

    _loadMap(position){

        const {latitude} = position.coords;
        const {longitude} = position.coords;

        const coords = [latitude, longitude];

        this.#map = L.map('map').setView(coords, this.#mapZoomLevel);

        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#workouts.forEach((work)=>(
            this._renderWorkoutMarker(work)
        ));

        this.#map.on('click', this._showForm.bind(this));
    }

    _hideForm(){
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value = '';
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(()=>{
            form.style.display = 'grid';
        },1000)
    }

    _toggleElevationField(){
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _showForm(mapE){
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _newWorkout(e){
        e.preventDefault();

        const type = inputType.value;
        const distance = Number(inputDistance.value);
        const duration = Number(inputDuration.value);
        const {lat, lng} = this.#mapEvent.latlng;
        let workout;

        const validInputs = (...inputs) => (
            inputs.every((inp)=>Number.isFinite(inp))
        );

        const allPositive = (...inputs) =>(
            inputs.every((inp) => inp > 0)
        );

        if(type === 'running'){
            const cadence = Number(inputCadence.value);

            if(!validInputs(distance, duration, cadence) || !allPositive(distance, duration, cadence)){
                return('Enter positive value');
            }
            workout = new Running([lat, lng], distance, duration, cadence);
        }

        if(type === 'cycling'){
            const elevation = Number(inputElevation.value);

            if(!validInputs(distance, duration, elevation) || !allPositive(distance, duration)){
                return('Enter positive value');
            }

            workout = new Cycling([lat, lng], distance, duration, elevation);
        }

        this.#workouts.push(workout);
        console.log(workout);

        this._renderWorkoutMarker(workout);
        this._hideForm();
        this._renderWorkoutList(workout);
        this._setLocalStorage();
    }

    _renderWorkoutMarker(workout){

        L.marker(workout.coords).addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth: 250,
            minWidth: 100,
            autoClose: false,
            closeOnClick: false,
            className: `${workout.type}-popup`
        }))
        .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
        .openPopup();
    }

    _renderWorkoutList(workout){
        let html = `
        <li class="workout workout--${workout.type}" data-id=${workout.id}>
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
                <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
                <span class="workout__value">${workout.distance}</span>
                <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
        `;

        if(workout.type === 'running'){
            html+= `
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
            `;
        }

        if(workout.type === 'cycling'){
            html+= `
                    <div class="workout__details">
                        <span class="workout__icon">⚡️</span>
                        <span class="workout__value">${workout.speed.toFixed(1)}</span>
                        <span class="workout__unit">km/h</span>
                    </div>
                    <div class="workout__details">
                        <span class="workout__icon">⛰</span>
                        <span class="workout__value">${workout.elevation}</span>
                        <span class="workout__unit">m</span>
                    </div>
                </li>
            `;
        }

        form.insertAdjacentHTML('afterend', html);
    }

    _movePopupToMarker(e){
        const workoutEl = e.target.closest('.workout');
        console.log(workoutEl);

        if(!workoutEl){
            return;
        }

        const workout = this.#workouts.find((work)=> work.id === workoutEl.dataset.id);
        console.log(workout);

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate:true,
            pan:{
                duration:1,
            }
        })
    }

    _setLocalStorage(){
        localStorage.setItem('workout', JSON.stringify(this.#workouts));
    }

    _getLocalStorage(){
        const data = JSON.parse(localStorage.getItem('workout'));

        if(!data){
            return;
        }

        this.#workouts = data;

        this.#workouts.forEach((work)=>(
            this._renderWorkoutList(work)
        ))
    }
}

const app = new App;