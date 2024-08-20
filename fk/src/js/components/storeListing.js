import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import utils from "../dependencies/custom/react-utilities";
import Settings from "../dependencies/custom/settings";

const StoreListing = () => {

   const { id } = useParams();


   async function details (){
     
    const res = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/get_store_product`,
      null,
      { store_id: id }
    );

    console.log(res)

   }


   useMemo((

    async function details (){
     
    const res = await utils.requestWithReauth(
      "post",
      `${Settings.backend}/get_store_product`,
      null,
      { store_id: id }
    );

    console.log(res)

   }


    
     
   ),[])

  
  return (
    <div className="container mt-4">
      <h2 className="mb-3">Entire villa in Costa Adeje, Spain</h2>
      <p className="text-muted">10 guests · 5 bedrooms · 7 beds · 3.5 baths</p>

      <div className="d-flex align-items-center mb-3">
        <span className="h5 me-2 mb-0">4.82</span>
        <span className="text-muted">(38 reviews)</span>
      </div>

      <div className="card mb-3">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div
              className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3"
              style={{ width: "40px", height: "40px" }}
            >
              J
            </div>
            <div>
              <h5 className="card-title mb-0">Hosted by Jamal</h5>
              <p className="card-text text-muted">
                Superhost · 2 years hosting
              </p>
            </div>
          </div>

          <p className="card-text">
            <strong>Jamal is a Superhost</strong>
            <br />
            Superhosts are experienced, highly rated Hosts.
          </p>

          <p className="card-text">
            <strong>Great check-in experience</strong>
            <br />
            100% of recent guests gave the check-in process a 5-star rating.
          </p>

          <p className="card-text">
            <strong>Free cancellation before Sep 12</strong>
            <br />
            Get a full refund if you change your mind.
          </p>
        </div>
      </div>

      <p className="mb-4">
        Very spacious and bright villa in Roque del Conde, perfect for families
        or friends looking to enjoy the wonderful ocean views and La Gomera
        while having fun in the spectacular pool and sun all year round. It is
        the perfect place to disconnect and relax for you and your loved ones in
        Tenerife, close to the best beaches, shopping malls, restaurants and
        water parks, but in turn enjoying the tranquility and views of Roque del
        Conde.
      </p>

     

      <h3 className="mb-3">What this place offers</h3>
      <ul className="list-unstyled row">
        <li className="col-md-6 mb-2">
          <i className="fa fa-water me-2"></i> Beach view
        </li>
        <li className="col-md-6 mb-2">
          <i className="fa fa-tree me-2"></i> Garden view
        </li>
        <li className="col-md-6 mb-2">
          <i className="fa fa-cup-hot me-2"></i> Kitchen
        </li>
        <li className="col-md-6 mb-2">
          <i className="fa fa-wifi me-2"></i> Wifi
        </li>
        <li className="col-md-6 mb-2">
          <i className="fas fa-parking me-2"></i> Free parking on premises
        </li>
        <li className="col-md-6 mb-2">
          <i className="fa fa-water me-2"></i> Private pool - available all year
        </li>
        <li className="col-md-6 mb-2">
          <i className="fa fa-water me-2"></i> Private hot tub
        </li>
        <li className="col-md-6 mb-2">
          <i className="fa fa-tv me-2"></i> 75 inch HDTV with Disney+, HBO Max,
          Netflix, premium cable
        </li>
      </ul>
    </div>
  );
};

export default StoreListing;
