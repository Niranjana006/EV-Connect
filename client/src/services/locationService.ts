export const getCurrentLocation = () => {
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (err) => reject(err)
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  };