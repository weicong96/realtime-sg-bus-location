module.exports = {
  campus:{
    main_url: "https://baseride.com/maps/public/ntu",
    api_url: "https://baseride.com/routes/apigeo/routevariantvehicle/",
    buses: {
    },
    weekday_text: "*/15 * 8-23 * * 0-4",
    weekend_text: "*/15 * 8-23 * * 5-6",
  },
  public: {
    api_url: "http://datamall2.mytransport.sg/ltaodataservice/",
    AccountKey: "",
    buses: [],
    offsetArrival: 30 * 1000,
    firstStop_text: "*/20 * * * * *",
    nextStop_text: "*/20 * * * * *"
  }
}
