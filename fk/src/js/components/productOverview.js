import { Card } from "antd";
import React, { memo } from "react";

const ProductDetails = ({product , supplier }) => {

  

  return (
    <>
      <div className="p-4 container">
        <div className="row">
          
          <div className="col-md-8">
            <div>
              <h2 className="fs-6 fw-bold mb-4">Product Details</h2>
              <div className="row">
                <div className="col-12 gap-4">
                  <div className="row">
                    <div className="col-6">
                      <div className="d-flex justify-content-between">
                        <h4 className="fs-6 text-muted fw-normal">
                          Product ID :
                        </h4>
                        <p className="fw-semibold">{product?.custom_id}</p>
                      </div>{" "}
                      <div className="d-flex justify-content-between">
                        <h4 className="fs-6 text-muted fw-normal">
                          Product Name :
                        </h4>
                        <p className="fw-semibold">{product?.name}</p>
                      </div>{" "}
                      <div className="d-flex justify-content-between">
                        <h4 className="fs-6 text-muted fw-normal">
                          Product Category :
                        </h4>
                        <p className="fw-semibold">
                          {product?.sub_category}
                        </p>
                      </div>{" "}
                      <div className="d-flex justify-content-between">
                        <h4 className="fs-6 text-muted fw-normal">
                          Expiry Date :
                        </h4>
                        <p className="fw-semibold">{product?.expiry_date}</p>
                      </div>{" "}
                      <div className="d-flex justify-content-between">
                        <h4 className="fs-6 text-muted fw-normal">
                          Quantity :
                        </h4>
                        <p className="fw-semibold">{product?.quantity}</p>
                      </div>
                      <div className="d-flex justify-content-between">
                        <h4 className="fs-6 text-muted fw-normal">
                          Threshold Value :
                        </h4>
                        <p className="fw-semibold">
                          {product?.threshold_value}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>{" "}

            
            <div>
              <h2 className="fs-6 fw-bold my-4">Supplier Details</h2>
              <div className="row">
                <div className="col-12 gap-4">
                  <div className="row">
                    <div className="col-6">
                      <div className="d-flex justify-content-between">
                        <h4 className="fs-6 text-muted fw-normal">
                          Supplier Name :
                        </h4>
                        <p className="fw-semibold">
                          {supplier?.surname} {supplier?.firstname} {supplier?.middlename}
                          
                         
                        </p>
                      </div>{" "}
                      <div className="d-flex justify-content-between">
                        <h4 className="fs-6 text-muted fw-normal">Email:</h4>
                        <p className="fw-semibold">{supplier?.email}</p>
                      </div>{" "}
                      <div className="d-flex justify-content-between">
                        <h4 className="fs-6 text-muted fw-normal">Contact :</h4>
                        <p className="fw-semibold">{supplier?.phone_number}</p>
                      </div>{" "}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">78</div>
        </div>
      </div>
    </>
  );
};

export default memo(ProductDetails);
