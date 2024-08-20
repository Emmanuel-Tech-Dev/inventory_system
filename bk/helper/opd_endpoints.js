const Model = require("../model/model");

class InventoryManagementEndpoints {
  constructor(app) {
    this.app = app;

    this.getAllCards(app);
    this.getPatientCard(app);
    this.submitPatientCard(app);
    this.getPatientSessions(app);
    this.startSession(app);
    this.updatePatientSession(app);
    this.addDependent(app);
    this.getDependentParent(app);
    this.getAllCategories(app);
    this.getAllProducts(app);
    this.getSupplierID(app);
    this.getStoreID(app);
    this.getSingleProduct(app);
    this.getSupplier(app);
    this.getSubCategoryByID(app);
    this.addStoreProduct(app);
    this.getStoreProduct(app);
    // this.addNewCategory(app);
    // this.addNewSubCategory(app);
    return this;
  }

  getAllCategories(app) {
    app.post("/get_all_categories", async (request, response) => {
      try {
        // console.log(request.body
        const res = await new Model()
          .select("inventory_category", ["*"])
          .query();
        response.json({
          status: "Ok",
          msg: "Operation success",
          category: res,
        });
      } catch (err) {
        console.log(err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }

  getAllProducts(app) {
    app.post("/get_all_products", async (request, response) => {
      try {
        // console.log(request.body
        const res = await new Model().select("product", ["*"]).query();
        response.json({
          status: "Ok",
          msg: "Operation success",
          product: res,
        });
      } catch (err) {
        console.log(err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }

  getSupplierID(app) {
    app.post("/get_highest_supplier_id", async (request, response) => {
      try {
        const res = await new Model()
          .select("supplier", ["supplier_id"])
          .orderBy("supplier_id DESC")
          .limit(1)
          .query();

        let highestID = null;

        if (res.length > 0) {
          highestID = res[0].supplier_id;
        }

        if (highestID) {
          response.json({
            status: "Ok",
            msg: "Operation success",
            highestID: highestID,
          });
        } else {
          response.json({
            status: "Ok",
            msg: "No suppliers found",
            highestID: null,
          });
        }
      } catch (err) {
        console.log(err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }

  getStoreID(app) {
    app.post("/get_highest_store_id", async (request, response) => {
      try {
        const res = await new Model()
          .select("store", ["store_id"])
          .orderBy("store_id DESC")
          .limit(1)
          .query();

        let highestID = null;

        if (res.length > 0) {
          highestID = res[0].store_id;
        }

        if (highestID) {
          response.json({
            status: "Ok",
            msg: "Operation success",
            highestID: highestID,
          });
        } else {
          response.json({
            status: "Ok",
            msg: "No stores found",
            highestID: null,
          });
        }
      } catch (err) {
        console.log(err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }

  getSingleProduct(app) {
    app.post("/get_single_product", async (request, response) => {
      try {
        const { custom_id } = request.body;
        // console.log(id);
        // console.log(request.body
        if (!custom_id) {
          return response.status(400).json({
            status: "Error",
            msg: "Product ID is required",
          });
        }
        const res = await new Model()
          .select("product", ["*"])
          .where(null, [{ custom_id }])
          .query();
        response.json({
          status: "Ok",
          msg: "Operation success",
          product: res,
        });
      } catch (err) {
        console.log(err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }

  getSubCategoryByID(app) {
    app.post("/get_single_subCategory", async (request, response) => {
      try {
        const { custom_id } = request.body;
        // console.log(custom_id);
        // console.log(request.body
        if (!custom_id) {
          return response.status(400).json({
            status: "Error",
            msg: "Sub-Category ID is required",
          });
        }
        const res = await new Model()
          .select("sub_category", ["*"])
          .where(null, [{ custom_id }])
          .query();
        response.json({
          status: "Ok",
          msg: "Operation success",
          subCategory: res,
        });
      } catch (err) {
        console.log(err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }

  getSupplier(app) {
    app.post("/get_single_supplier", async (request, response) => {
      try {
        const { supplier_id } = request.body;
        //  console.log(supplier_id)
        // console.log(request.body
        if (!supplier_id) {
          return response.status(400).json({
            status: "Error",
            msg: "No supplier available",
          });
        }
        const res = await new Model()
          .select("supplier", ["*"])
          .where(null, [{ supplier_id }])
          .query();
        response.json({
          status: "Ok",
          msg: "Operation success",
          supplier: res,
        });
      } catch (err) {
        console.log(err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }

  addStoreProduct(app) {
    app.post("/add_store_product", async (request, response) => {
      try {
        const { record, selectedStore } = request.body;
        console.log(record);

        // console.log("Received record:", record, selectedPatient);
        const { product_id } = record;
        const { store_id } = selectedStore;
        const admin_id = "K3050";

        const res = await new Model()
          .insertSome("store_product", {
            store_id: store_id,
            product_id: product_id,
          })
          .query();

        console.log(res);

        // if (id) {
        //   const res = await new Model()
        //     .update("store_product", [
        //       { card_type },
        //       // { reg_number },
        //       { serial_number },
        //       { card_number },
        //       // new Date(),
        //     ])
        //     .where(null, [{ id }])
        //     .query();
        //   console.log(res);
        // } else {
        //   const res = await new Model()
        //     .insertSome("store_product", {
        //       store_id: selectedStore?.store_id,
        //       product_id: record?.product_id,
        //     })
        //     .query();

        //   console.log(res);
        // }

        response.json({ status: "Ok", msg: "Operation success" });
      } catch (err) {
        console.log("Error:", err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }

  getStoreProduct(app) {
    app.post("/get_store_product", async (request, response) => {
      try {
        // console.log(request.body)
        const { store_id } = request.body;

        const res = await new Model()
          .select("store_product", ["*"])
          .where(null, [{ store_id }])
          .query();
        response.json({
          status: "Ok",
          msg: "Operation success",
          store_product: res,
        });
      } catch (err) {
        console.log(err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }
























  

  getAllCards(app) {
    app.post("/get_all_card", async (request, response) => {
      try {
        // console.log(request.body
        const res = await new Model().select("card_type", ["*"]).query();
        response.json({
          status: "Ok",
          msg: "Operation success",
          cards: res,
        });
      } catch (err) {
        console.log(err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }
  getPatientCard(app) {
    app.post("/get_patient_card", async (request, response) => {
      try {
        // console.log(request.body)
        const { patient_custom_id } = request.body;

        const res = await new Model()
          .select("patient_cards", ["*"])
          .where(null, [{ patient_custom_id }])
          .query();
        response.json({
          status: "Ok",
          msg: "Operation success",
          patient_cards: res,
        });
      } catch (err) {
        console.log(err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }
  // (app) {
  //   app.post("/submit_patient_card", async (request, response) => {
  //     try {
  //       const { record, selectedPatient } = request.body;
  //       console.log(record);
  //       // console.log("Received record:", record, selectedPatient);
  //       const { card_type, serial_number, card_number, id } = record;
  //       const { reg_number, custom_id } = selectedPatient;
  //       const admin_id = "K3050";

  //       if (id) {
  //         const res = await new Model()
  //           .update("patient_cards", [
  //             { card_type },
  //             // { reg_number },
  //             { serial_number },
  //             { card_number },
  //             // new Date(),
  //           ])
  //           .where(null, [{ id }])
  //           .query();
  //         console.log(res);
  //       } else {
  //         const res = await new Model()
  //           .insertSome("patient_cards", {
  //             card_type,
  //             reg_number: reg_number,
  //             serial_number,
  //             card_number,
  //             date_inserted: new Date(),
  //             patient_custom_Id: custom_id,
  //             admin_id,
  //             custom_id: record?.custom_id,
  //           })
  //           .query();

  //         console.log(res);
  //       }

  //       response.json({ status: "Ok", msg: "Operation success" });
  //       // const obj = Utilities.renameFilters(
  //       //   { ...record, ...selectedPatient, admin_id },
  //       //   { custom_id: "patient_custom_Id" }
  //       // );
  //       // // Fetch the custom_id from the records table based on custom_id
  //       // let data = await new Model().genInsertSomeFields(
  //       //   Model,
  //       //   "patient_cards",
  //       //   obj,
  //       // );
  //       // delete data["id"];
  //       // await new Model().insertSome("patient_cards", data).query();
  //       // response.json({ status: "Ok", msg: "Operation success" });
  //       // console.log(data);

  //       // if (id) {
  //       //   // Update existing record
  //       //   const res = await new Model()
  //       //     .update("patient_cards", [
  //       //       { card_type },
  //       //       { reg_number },
  //       //       { serial_number },
  //       //       { card_number },
  //       //       { admin_id },
  //       //       { date_updated: new Date() }, // Assuming you have a date_updated field
  //       //       { custom_id: foreign_key_value }, // Use the foreign key field here
  //       //     ])
  //       //     .where(null, [{ id }])
  //       //     .query();

  //       //   console.log("Update result:", res);
  //       // } else {
  //       //   // Insert new record
  //       //   const res = await new Model()
  //       //     .insertSome("patient_cards", {
  //       //       card_type,
  //       //       reg_number,
  //       //       serial_number,
  //       //       card_number,
  //       //       date_inserted: new Date(), // Assuming you have a date_inserted field
  //       //       admin_id: admin_id || "105", // Example admin_id, change as needed
  //       //       custom_id: foreign_key_value, // Use the foreign key field here
  //       //     })
  //       //     .query();

  //       //   console.log("Insert result:", res);
  //       // }

  //       // response.json({ status: "Ok", msg: "Operation success" });
  //     } catch (err) {
  //       console.log("Error:", err.message);
  //       response.json({
  //         status: "Error",
  //         msg: "Operation failed",
  //         msg2: err.message,
  //       });
  //     }
  //   });
  // }

  submitPatientCard(app) {
    app.post("/submit_patient_card", async (request, response) => {
      try {
        const { record, selectedPatient } = request.body;
        console.log(record);
        // console.log("Received record:", record, selectedPatient);
        const { card_type, serial_number, card_number, id } = record;
        const { reg_number, custom_id } = selectedPatient;
        const admin_id = "K3050";

        if (id) {
          const res = await new Model()
            .update("patient_cards", [
              { card_type },
              // { reg_number },
              { serial_number },
              { card_number },
              // new Date(),
            ])
            .where(null, [{ id }])
            .query();
          console.log(res);
        } else {
          const res = await new Model()
            .insertSome("patient_cards", {
              card_type,
              reg_number: reg_number,
              serial_number,
              card_number,
              date_inserted: new Date(),
              patient_custom_Id: custom_id,
              admin_id,
              custom_id: record?.custom_id,
            })
            .query();

          console.log(res);
        }

        response.json({ status: "Ok", msg: "Operation success" });
        // const obj = Utilities.renameFilters(
        //   { ...record, ...selectedPatient, admin_id },
        //   { custom_id: "patient_custom_Id" }
        // );
        // // Fetch the custom_id from the records table based on custom_id
        // let data = await new Model().genInsertSomeFields(
        //   Model,
        //   "patient_cards",
        //   obj,
        // );
        // delete data["id"];
        // await new Model().insertSome("patient_cards", data).query();
        // response.json({ status: "Ok", msg: "Operation success" });
        // console.log(data);

        // if (id) {
        //   // Update existing record
        //   const res = await new Model()
        //     .update("patient_cards", [
        //       { card_type },
        //       { reg_number },
        //       { serial_number },
        //       { card_number },
        //       { admin_id },
        //       { date_updated: new Date() }, // Assuming you have a date_updated field
        //       { custom_id: foreign_key_value }, // Use the foreign key field here
        //     ])
        //     .where(null, [{ id }])
        //     .query();

        //   console.log("Update result:", res);
        // } else {
        //   // Insert new record
        //   const res = await new Model()
        //     .insertSome("patient_cards", {
        //       card_type,
        //       reg_number,
        //       serial_number,
        //       card_number,
        //       date_inserted: new Date(), // Assuming you have a date_inserted field
        //       admin_id: admin_id || "105", // Example admin_id, change as needed
        //       custom_id: foreign_key_value, // Use the foreign key field here
        //     })
        //     .query();

        //   console.log("Insert result:", res);
        // }

        // response.json({ status: "Ok", msg: "Operation success" });
      } catch (err) {
        console.log("Error:", err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }
  getPatientSessions(app) {
    app.post("/get_patient_sessions", async (request, response) => {
      try {
        // console.log(request.body)
        const { patient_custom_id } = request.body;

        const res = await new Model()
          .select("session", ["*"])
          .where(null, [{ patient_custom_id }])
          .query();
        response.json({
          status: "Ok",
          msg: "Operation success",
          session: res,
        });
      } catch (err) {
        console.log(err.message);
        response.json({
          status: "Error",
          msg: "Operation failed",
          msg2: err.message,
        });
      }
    });
  }
  startSession(app) {
    app.post("/start_session", async (request, response) => {
      try {
        const { record, selectedPatient } = request.body;
        const { status, extra_details, type, patient_card_type } = record;

        console.log(record, selectedPatient);
        const admin_id = "K3050";

        await new Model()
          .update("session", [{ status: "closed" }])
          .where(null, [{ reg_number: selectedPatient?.reg_number }])
          .query();

        const res = await new Model()
          .insertSome("session", {
            custom_id: Utilities.generateUuid(),
            reg_number: selectedPatient?.reg_number,
            patient_custom_Id: selectedPatient?.custom_id,
            admin_id: admin_id,
            status: "opened",
            type,
            patient_card_type,
            extra_details,
            date_inserted: new Date(), // Use new Date() instead of Date.now() for a proper timestamp
          })
          .query();

        response.json({ status: "Ok", msg: "Operation success" });
      } catch (error) {
        console.error("Error inserting session:", error);
        response
          .status(500)
          .json({ status: "Error", msg: "Operation failed", error });
      }
    });
  }
  updatePatientSession(app) {
    app.post("/update_patient_session", async (request, response) => {
      try {
        const { record } = request.body;
        console.log(record);
        const { extra_details, type, patient_card_type, id } = record;

        const res = await new Model()
          .update("session", [
            { extra_details },
            { type },
            { patient_card_type },
          ])
          .where(null, [{ id }])
          .query();
        console.log(res);
        response.json({ status: "Ok", msg: "Operation success" });
      } catch (error) {
        console.error("Error inserting session:", error);
        response
          .status(500)
          .json({ status: "Error", msg: "Operation failed", error });
      }
    });
  }
  addDependent(app) {
    app.post("/add_dependent", async (request, response) => {
      try {
        const { record, selectedPatient } = request.body;
        const { parent_id } = record;

        console.log(parent_id, selectedPatient);

        const res = new Model()
          .insertSome("dependent", {
            parent_id: parent_id,
            child_id: parent_id,
            date_inserted: new Date(),
          })
          .query();
        console.log(res);
        response.json({ status: "Ok", msg: "Operation success" });
      } catch (error) {
        console.error("Error inserting session:", error);
        response
          .status(500)
          .json({ status: "Error", msg: "Operation failed", error });
      }
    });
  }
  getDependentParent(app) {
    app.post("/get_dependent_parent", async (request, response) => {
      try {
        const { reg_number } = request.body;

        const res = await new Model()
          .select("dependent")
          .where(null, [{ child_id: reg_number }])
          .query();

        response.json({
          status: "Ok",
          msg: "Operation success",
          result: res,
        });
      } catch (error) {
        console.error("Error inserting session:", error);
        response
          .status(500)
          .json({ status: "Error", msg: "Operation failed", error });
      }
    });
  }
}

module.exports = InventoryManagementEndpoints;
