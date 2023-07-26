const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
};

const showAlert = (type, msg) => {
  hideAlert();
  const markup = `<div class="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
};

const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoiYWJkdWxsYWhhaG1lZDY4NTkiLCJhIjoiY2xqb2N6cnYyMWRjbjNycGl5aWR4bHY2eSJ9.PsTBrmTxEIK4PClunousuw';

  let map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/abdullahahmed6859/cljodry9l00h701pm9htvf6wp',
    scrollZoom: false
  });

  let bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    const el = document.createElement('div');
    el.className = 'marker';

    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    let popuptext;
    if (loc.day) popuptext = `Day ${loc.day}`;
    else popuptext = 'Start Location';
    new mapboxgl.Popup({ closeButton: true, closeOnClick: false, offset: 25 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>${popuptext}: ${loc.description}</p>`)
      .addTo(map);

    bounds.extend(loc.coordinates);
    window.scrollTo(0, 0);
  });

  if (!bounds.isEmpty())
    map.fitBounds(bounds, {
      padding: {
        top: 180,
        bottom: 120,
        left: 50,
        right: 50
      }
    });
};

const login = async (email, password) => {
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: { email, password }
    });

    if (res.data.status === 'success') {
      showAlert('success', 'Login successful');
      window.setTimeout(() => {
        location.assign('/');
      }, 100);
    }
  } catch (err) {
    showAlert('error', 'Error Logging in');
  }
};

const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout'
    });
    if (res.data.status === 'success') location.assign('/');
    showAlert('success', 'logged out');
  } catch (err) {
    showAlert('error', 'error logging out try again');
    console.log(err);
  }
};

const updateSettings = async (data, type) => {
  try {
    const endsWith = type === 'password' ? 'MyPassword' : 'Me';
    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/update${endsWith}`,
      data
    });
    if (res.data.status === 'success')
      showAlert('success', `${type.toUpperCase()} Updated Successfully`);
    window.setTimeout(() => location.reload(), 100);
  } catch (err) {
    showAlert('error', err.message);
    console.log(err);
  }
};

try {
  const logOutBtn = document.querySelector('.nav__el--logout');
  logOutBtn.addEventListener('click', logout);
} catch (err) {}

try {
  let mapBox = document.getElementById('map');
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
} catch (err) {}

try {
  const locations = JSON.parse(
    document.getElementById('map').dataset.locations
  );
  displayMap(locations);
} catch (err) {}

try {
  const loginForm = document.querySelector('.form--login');
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    login(
      document.getElementById('email').value,
      document.getElementById('password').value
    );
  });
} catch (err) {}

try {
  const updateDataForm = document.querySelector('.form-user-data');
  updateDataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);
    document.querySelector('.btn--save-user-data').textContent = 'Updating...';
    await updateSettings(form, 'data');

    document.querySelector('.btn--save-user-data').textContent =
      'Save Settings';
  });
} catch (err) {}

try {
  const updatePasswordForm = document.querySelector('.form-user-password');
  updatePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    await updateSettings(
      {
        currentPassword: document.getElementById('password-current').value,
        password: document.getElementById('password').value,
        passwordConfirm: document.getElementById('password-confirm').value
      },
      'password'
    );

    document.querySelector('.btn--save-password').textContent = 'Save Password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
} catch (err) {}
