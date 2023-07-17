const createMap = (locations) => {
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

const locations = JSON.parse(document.getElementById('map').dataset.locations);
createMap(locations);
window.scrollTo(0, 0);
