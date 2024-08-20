var Utilities = {
  suppllierIDGenerator: (prefix = "SUP", initialNumber = 1) => {
    const storageKey = `${prefix}CurrentNumber`;

    return () => {
      let currentNumber =
        parseInt(localStorage.getItem(storageKey)) || initialNumber;
      const paddedNumber = currentNumber.toString().padStart(3, "0");
      const newCode = `${prefix}${paddedNumber}`;

      currentNumber += 1;
      localStorage.setItem(storageKey, currentNumber.toString());

      return newCode;
    };
  },

  validateForm: (required) => {
    let inputValues = [];
    let errorFields = [];
    let isValid = [];
    let boolValid = [];
    for (let i = 0; i < required.length; i++) {
      let rules = required[i].rules;
      let id = required[i].id;
      let value = $("#" + id).val();
      boolValid = [];
      for (let j = 0; j < rules.length; j++) {
        //firing rules
        let valid = rules[j](value); // rule will return a boolean value.
        boolValid.push(valid);
      }
      isValid.push({ valid: boolValid });
    }
    for (let i = 0; i < required.length; i++) {
      //checking if fields are valid after the rules have been invoked
      let validCounter = 0;
      let id = required[i].id;
      let value = $.trim($("#" + id).val());
      let currentFieldBoolsValid = isValid[i].valid;
      for (let j = 0; j < currentFieldBoolsValid.length; j++) {
        if (currentFieldBoolsValid[j]) {
          //increase counter if field is true
          validCounter++;
        }
      }
      //push field value to inputValues if all field are valid else push id of field to errorFields
      if (currentFieldBoolsValid.length == validCounter) {
        inputValues.push({ id: id, value: value });
      } else {
        errorFields.push(id);
      }
    }
    //return true with inputValues if inputValues is equal to required else false with errorFields
    if (inputValues.length == required.length) {
      return { formValid: true, values: inputValues };
    } else {
      return { formValid: false, values: errorFields };
    }
  },

  validateSoftData: (dataRules, idVal) => {
    let inputValues = [];
    let errorFields = [];
    let isValid = [];
    let boolValid = [];
    for (let i = 0; i < idVal.length; i++) {
      for (let j = 0; j < dataRules.length; j++) {
        if (idVal[i].id === dataRules[j].id) {
          // console.log(dataRules,idVal);
          let rules = dataRules[j].rules;
          let value = idVal[i].val;
          for (let k = 0; k < rules.length; k++) {
            //firing rules
            let valid = rules[k](value); // rule will return a boolean value.
            boolValid.push(valid);
          }
          isValid.push({ valid: boolValid });
        }
      }
    }

    for (let i = 0; i < idVal.length; i++) {
      //checking if fields are valid after the rules have been invoked
      let validCounter = 0;
      let id = idVal[i].id;
      let value = $.trim(idVal[i].val);
      let currentFieldBoolsValid = isValid[i].valid;
      for (let j = 0; j < currentFieldBoolsValid.length; j++) {
        if (currentFieldBoolsValid[j]) {
          //increase counter if field is true
          validCounter++;
        }
      }
      //push field value to inputValues if all field are valid else push id of field to errorFields
      if (currentFieldBoolsValid.length == validCounter) {
        inputValues.push({ id: id, value: value });
      } else {
        errorFields.push(id);
      }
    }
    // return true with inputValues if inputValues is equal to required else false with errorFields
    if (inputValues.length == idVal.length) {
      return { dataValid: true, values: inputValues };
    } else {
      return { dataValid: false, values: errorFields };
    }
  },
  validateData(data, utils) {
    let rules = [];
    let rule = null;
    for (let i = 0; i < data.length; i++) {
      let required = data[i].required;
      if (required) {
        rule = {
          id: data[i].id,
          rules: [
            (val) => {
              let valid = utils.ValidationFactory.validateEmptyString(val);
              if (!valid) {
                utils.notifyMsgRelativeToElem(data[i].id, "Field Required");
                // utils.toastMsg('Title is required', settings.toastErrorBg, settings.toastLoaderBg);
                utils.applyEffectToElem(data[i].id, "highlight");
              }
              return valid;
            }, //FUNCTION 1
          ],
        }; //end rule
      } else {
        rule = {
          id: data[i].id,
          rules: [
            (val) => {
              return true;
            }, //FUNCTION 1
          ],
        };
      }
      rules.push(rule);
    }
    return utils.validateForm(rules);
  }, //end function
  notifyMsgRelativeToElem(elemId, msg) {
    $("#" + elemId).notify(msg);
  },
  listentoEnterKey(InputClassName, btnToTrigger) {
    $(InputClassName).on("keyup", function (event) {
      // Number 13 is the "Enter" key on the keyboard
      if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        $(btnToTrigger).trigger("click");
      }
    });
  },
  saveData(endpoint, data, utils) {
    return new Promise((resolve, reject) => {
      utils.postItems(JSON.stringify([data, endpoint]), (res) => {
        let parsedRes = JSON.parse(res);
        resolve(parsedRes);
      });
    });
  },
  fetchDetails(endpoint, token, data, utils) {
    return new Promise((resolve, reject) => {
      utils.postItems(JSON.stringify([token, data, endpoint]), (res) => {
        let parsedRes = JSON.parse(res);
        resolve({ data: parsedRes });
      });
    });
  },
  listAllEventListeners() {
    const allElements = Array.prototype.slice.call(
      document.querySelectorAll("*")
    );
    allElements.push(document);
    allElements.push(window);
    const types = [];
    for (let ev in window) {
      if (/^on/.test(ev)) types[types.length] = ev;
    }
    let elements = [];
    for (let i = 0; i < allElements.length; i++) {
      const currentElement = allElements[i];
      for (let j = 0; j < types.length; j++) {
        if (typeof currentElement[types[j]] === "function") {
          elements.push({
            node: currentElement,
            type: types[j],
            func: currentElement[types[j]].toString(),
          });
        }
      }
    }
    return elements.sort(function (a, b) {
      return a.type.localeCompare(b.type);
    });
  },
  clock(clockElem) {
    let date = new Date();
    function addZero(x) {
      if (x < 10) {
        return (x = "0" + x);
      } else {
        return x;
      }
    }
    function twelveHour(x) {
      if (x > 12) {
        return (x = x - 12);
      } else if (x == 0) {
        return (x = 12);
      } else {
        return x;
      }
    }
    var h = addZero(twelveHour(date.getHours()));
    var m = addZero(date.getMinutes());
    var s = addZero(date.getSeconds());
    $(clockElem).text(h + ":" + m + ":" + s);
  },
  clockUpdate(utils, clockElem) {
    setInterval(utils.clock.bind(null, clockElem), 1000);
  },
  validateTwoDates(lesser, greater) {
    //if the review date is empty don't validate. this will prevent errors of consultations prior to adding this feature (i.e. the review dates) from occuring
    if (lesser == null || lesser == "" || greater == null || greater == "") {
      return false;
    }
    let g = new Date(greater);
    let gMs = g.getTime();
    let l = new Date(lesser);
    let lMs = l.getTime();
    // This will return you the number of milliseconds
    // elapsed from January 1, 1970
    // if your date is less than that date, the value will be negative
    if (gMs < lMs) {
      return false;
    } else {
      return true;
    }
  },

  validateCurrDateAgainstSelDate(utils, selDate) {
    return new Promise((resolve, reject) => {
      utils.postItems(
        JSON.stringify(["get_server_date"]),
        function (responseData) {
          // This will return you the number of milliseconds
          // elapsed from January 1, 1970
          // if your date is less than that date, the value will be negative
          let serverDateTime = JSON.parse(responseData);
          let dateNow = new Date(serverDateTime);
          let millisecondsNow = dateNow.getTime();
          let sDate = new Date(selDate);
          let sDateMillisecond = sDate.getTime();
          if (selDate == "")
            reject({ msg: "No date set", valid: false, errCode: 1 });
          if (sDateMillisecond <= millisecondsNow) {
            reject({ msg: "Invalid date", valid: false, errCode: 2 });
          } else {
            resolve({ msg: selDate, valid: true });
          }
        }
      );
    });
  },

  getPerms(utils, perm, cb) {
    utils.postItems(
      JSON.stringify([sessionStorage.getItem("token"), "get_perms"]),
      function (perms) {
        let p = JSON.parse(perms);
        for (let i = 0; i < p.length; i++) {
          let permission = p[i].permission;
          if (permission == perm) {
            cb(perm);
            break;
          }
        }
      }
    );
  },
  //this fn returns the file's base64 as a promise
  toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      const covertedFileSize = Utilities.convertFileSize(file.size);
      const fileSize = Utilities.getFileSize(file.size);
      const fileName = file.name;
      reader.onload = () =>
        resolve({
          result: reader.result,
          covertedFileSize: covertedFileSize,
          fileSize: fileSize,
          fileType: Utilities.getBase64FileType(reader.result),
          fileName: fileName,
        });
      reader.onerror = (error) => reject(error);
    });
  },
  //this fn puts all base64 files promises into promise.all
  async tobase64Handler(files) {
    const filePathsPromises = [];
    for (let i = 0; i < files.length; i++) {
      filePathsPromises.push(Utilities.toBase64(files[i]));
    }
    const filePaths = await Promise.all(filePathsPromises);
    return filePaths;
  },

  getBase64FileType(base64) {
    return base64.split(";")[0].split(":")[1].split("/")[1];
  },

  convertFileSize(size) {
    return Utilities.bytesConverter(size);
  },

  getFileSize(size) {
    return Math.round(size / 1024);
  },

  saveDataWithFiles(files, data, requiredTypes, requiredSize, endPoint) {
    return new Promise((resolve, reject) => {
      let fileSizeOk = true;
      let fileTypeOk = true;
      for (let i = 0; i < files.length; i++) {
        if (files[i].fileSize > requiredSize) {
          fileSizeOk = false;
          Utilities.toastMsg(
            "Please make sure the size of does not exceed 2M",
            "red",
            "red"
          );
          break;
        }
        if (!requiredTypes.includes(files[i].fileType)) {
          fileTypeOk = false;
        }
      }
      if (fileSizeOk && fileTypeOk) {
        Utilities.postItems(JSON.stringify([data, files, endPoint]), (res) => {
          let parsedRes = JSON.parse(res);
          if (parsedRes == "Ok") {
            resolve();
          } else {
            reject("Operation failed");
          }
        });
      } else {
        reject("FileSize and FileType not supported");
      }
    });
  },

  saveFiles(
    utils,
    files,
    requiredTypes,
    typeOf,
    extraDetails,
    endPoint,
    target
  ) {
    for (let i = 0; i < files.length; i++) {
      return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.readAsDataURL(files[i]);
        reader.onload = function () {
          let fileName = files[i].name;
          let fileSize = utils.bytesConverter(files[i].size);
          let type = reader.result.split(";")[0].split(":")[1].split("/")[1];
          if (requiredTypes.includes(type)) {
            const size = Math.round(files[i].size / 1024);
            if (size > 2048) {
              $(target).val("");
              utils.toastMsg(
                "Please make sure the size of " +
                  fileName +
                  " does not exceed 2M",
                /*settings.toastErrorBg*/ "red",
                /*settings.toastLoaderBg*/ "red"
              );
            } else {
              // save_id_card
              utils.postItems(
                JSON.stringify([
                  reader.result,
                  sessionStorage.getItem("token"),
                  fileName,
                  typeOf,
                  fileSize,
                  extraDetails,
                  endPoint,
                ]),
                (res) => {
                  let parsedRes = JSON.parse(res);
                  if (parsedRes == "Ok") {
                    $(target).val("");
                    resolve({
                      status: "success",
                      file: fileName,
                      msg: fileName + " uploaded successfully",
                    });
                  } else {
                    reject({
                      status: "failed",
                      file: fileName,
                      msg: fileName + " failed to upload",
                    });
                  }
                }
              );
            }
          } else {
            reject({
              status: "failed",
              file: fileName,
              msg: "File type of is not supported",
            });
            $(target).val("");
            utils.toastMsg(
              "File type is not supported",
              /*settings.toastErrorBg*/ "red",
              /*settings.toastLoaderBg*/ "red"
            );
          }
        }; //file reader onload
      });
    } //end loop
  }, //end fn

  zeroPad(num, places) {
    let zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
  },
  toastMsg(msg, toastBg, toastLoaderBg) {
    $.toast({
      text: msg,
      position: "top-right",
      hideAfter: 5000,
      bgColor: toastBg,
      loaderBg: toastLoaderBg,
    });
  },
  extractData(parentElem) {
    let data = [];
    $(parentElem)
      .find("input,select,textarea")
      .each((index, elem) => {
        let val = $(elem).val();
        let elemId = $(elem).prop("id");
        let required = $(elem).data("required");
        if (
          ($(elem).prop("type") != "checkbox" ||
            $(elem).prop("type") != "file") &&
          elemId != ""
        )
          data.push({ id: elemId, value: val, required: required });
      });
    return data;
  },
  extractDataNoStrict(parentElem) {
    let data = [];
    $(parentElem)
      .find("input,select,textarea")
      .each((index, elem) => {
        let val = $(elem).val();
        let elemId = $(elem).prop("id");
        let required = $(elem).data("required");
        if (
          $(elem).prop("type") != "checkbox" ||
          $(elem).prop("type") != "file"
        )
          data.push({ id: elemId, value: val, required: required });
      });
    return data;
  },
  clearData(parentElem) {
    $(parentElem)
      .find("input,select,textarea")
      .each((index, elem) => {
        $(elem).val("");
        $(elem).prop("disabled", false);
        if ($(elem).prop("type") == "checkbox") $(elem).prop("checked", false);
      });
  },
  animateToElement(elemId) {
    let offset = $("#" + elemId).offset();
    $("html, body").animate(
      {
        scrollTop: offset.top - 50,
        scrollLeft: offset.left - 50,
      },
      1000
    );
  },
  animateToElementGivenParentAndChild(parent, child) {
    let offset = $(child).offset();
    $(parent).animate(
      {
        scrollTop: offset.top - 50,
        scrollLeft: offset.left - 50,
      },
      1000
    );
  },
  cancelAnimationOnUserEvents() {
    $("html, body").on(
      "scroll mousedown wheel DOMMouseScroll mousewheel keyup touchmove",
      function () {
        $("html, body").stop();
      }
    );
  },
  applyEffectToElem(id, effect) {
    /** effect are blind,bounce,clip,drop,explode,fade,fold,highlight,puff,pulsate,scale,shake,size,tranfer,slide */
    $("#" + id).effect(effect, {}, 5000);
  },
  highlightElement(id, bgColor) {
    $("#" + id).css("background", bgColor);
  },
  getShadowRootData(parent, idList) {
    let idVal = [];
    let children = parent.children();
    for (let i = 0; i < children.length; i++) {
      let id = children[i].id;
      let val = children[i].value;
      if (idList.includes(id)) {
        idVal.push({ id: id, val: val });
      }
    }
    return idVal;
  },
  ValidationFactory: {
    //STRING VALIDATION  +(match one or more) *(match zero or more)
    validateNotNullString: (val) => {
      if ($.trim(val) != null) {
        return true;
      } else {
        return false;
      }
    },

    validateEmptyString: (val) => {
      if ($.trim(val) != "") {
        return true;
      } else {
        return false;
      }
    },
    validateAlpha: (val) => {
      let pattern = /^[a-zA-Z]+$/;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaAllowSpace: (val) => {
      let pattern = /^[a-zA-Z ]+$/;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaMinCharLength: (val, requiredMinCharLength) => {
      let valid = Utilities.ValidationFactory.validateAlpha(val);
      if (valid && $.trim(val).length >= requiredMinCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaMaxCharLength: (val, requiredMaxCharLength) => {
      let valid = Utilities.ValidationFactory.validateAlpha(val);
      if (valid && $.trim(val).length <= requiredMaxCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaMinMaxCharLength: (
      val,
      requiredMinCharLength,
      requiredMaxCharLength
    ) => {
      let valid = Utilities.ValidationFactory.validateAlpha(val);
      if (
        valid &&
        $.trim(val).length >= requiredMinCharLength &&
        $.trim(val).length <= requiredMaxCharLength
      ) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaMinCharLengthAllowSpace: (val, requiredMinCharLength) => {
      let valid = Utilities.ValidationFactory.validateAlphaAllowSpace(val);
      if (valid && $.trim(val).length >= requiredMinCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaMaxCharLengthAllowSpace: (val, requiredMaxCharLength) => {
      let valid = Utilities.ValidationFactory.validateAlphaAllowSpace(val);
      if (valid && $.trim(val).length <= requiredMaxCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaMinMaxCharLengthAllowSpace: (
      val,
      requiredMinCharLength,
      requiredMaxCharLength
    ) => {
      let valid = Utilities.ValidationFactory.validateAlphaAllowSpace(val);
      if (
        valid &&
        $.trim(val).length >= requiredMinCharLength &&
        $.trim(val).length <= requiredMaxCharLength
      ) {
        return true;
      } else {
        return false;
      }
    },

    //NUMBER VALIDATION
    validateNumber: function (val) {
      let pattern = /^[\d]+$/;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },
    validateDecNumber: function (val) {
      let pattern = /^[\d.]+$/;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },
    validateNumberAllowSpace: function (val) {
      let pattern = /^[\d ]+$/;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },
    validateNumberMinCharLength: function (val, requiredMinCharLength) {
      let valid = Utilities.ValidationFactory.validateNumber(val);
      if (valid && $.trim(val).length >= requiredMinCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateNumberMaxCharLength: function (val, requiredMaxCharLength) {
      let valid = Utilities.ValidationFactory.validateNumber(val);
      if (valid && $.trim(val).length <= requiredMaxCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateNumberMinMaxCharLength: function (
      val,
      requiredMinCharLength,
      requiredMaxCharLength
    ) {
      let valid = Utilities.ValidationFactory.validateNumber(val);
      if (
        valid &&
        $.trim(val).length >= requiredMinCharLength &&
        $.trim(val).length <= requiredMaxCharLength
      ) {
        return true;
      } else {
        return false;
      }
    },

    validateNumberMinCharLengthAllowSpace: function (
      val,
      requiredMinCharLength
    ) {
      let valid = Utilities.ValidationFactory.validateNumberAllowSpace(val);
      if (valid && $.trim(val).length >= requiredMinCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateNumberMaxCharLengthAllowSpace: function (
      val,
      requiredMaxCharLength
    ) {
      let valid = Utilities.ValidationFactory.validateNumberAllowSpace(val);
      if (valid && $.trim(val).length <= requiredMaxCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateNumberMinMaxCharLengthAllowSpace: function (
      val,
      requiredMinCharLength,
      requiredMaxCharLength
    ) {
      let valid = Utilities.ValidationFactory.validateNumberAllowSpace(val);
      if (
        valid &&
        $.trim(val).length >= requiredMinCharLength &&
        $.trim(val).length <= requiredMaxCharLength
      ) {
        return true;
      } else {
        return false;
      }
    },

    //ALPHANUMERIC VALIDATION
    validateAlphaNumeric: (val) => {
      let pattern = /^[0-9a-zA-Z]+$/;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaNumericAllowSpace: (val) => {
      let pattern = /^[0-9a-zA-Z ]+$/;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaNumericAllowExtraChar: (val) => {
      let pattern = /^[0-9a-zA-Z.@$#_ ]+$/;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaNumericMinCharLength: (val, requiredMinCharLength) => {
      let valid = Utilities.ValidationFactory.validateAlphaNumeric(val);
      if (valid && $.trim(val).length >= requiredMinCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaNumericMaxCharLength: (val, requiredMaxCharLength) => {
      let valid = Utilities.ValidationFactory.validateAlphaNumeric(val);
      if (valid && $.trim(val).length <= requiredMaxCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaNumericMinMaxCharLength: (
      val,
      requiredMinCharLength,
      requiredMaxCharLength
    ) => {
      let valid = Utilities.ValidationFactory.validateAlphaNumeric(val);
      if (
        valid &&
        $.trim(val).length >= requiredMinCharLength &&
        $.trim(val).length <= requiredMaxCharLength
      ) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaNumericMinCharLengthAllowSpace: (
      val,
      requiredMinCharLength
    ) => {
      let valid =
        Utilities.ValidationFactory.validateAlphaNumericAllowSpace(val);
      if (valid && $.trim(val).length >= requiredMinCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaNumericMaxCharLengthAllowSpace: (
      val,
      requiredMaxCharLength
    ) => {
      let valid =
        Utilities.ValidationFactory.validateAlphaNumericAllowSpace(val);
      if (valid && $.trim(val).length <= requiredMaxCharLength) {
        return true;
      } else {
        return false;
      }
    },
    validateAlphaNumericMinMaxCharLengthAllowSpace: (
      val,
      requiredMinCharLength,
      requiredMaxCharLength
    ) => {
      let valid =
        Utilities.ValidationFactory.validateAlphaNumericAllowSpace(val);
      if (
        valid &&
        $.trim(val).length >= requiredMinCharLength &&
        $.trim(val).length <= requiredMaxCharLength
      ) {
        return true;
      } else {
        return false;
      }
    },

    //EMAIL VALIDATION
    validateEmailWithUnicode: function (val) {
      let pattern =
        /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },
    validateEmailNoUnicode: function (val) {
      let pattern =
        /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },
    validateSimpleEmail: function (val) {
      let pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },

    //TELEPHONE NUMBER VALIDATION
    validateTelephoneNumber: function (val) {
      let pattern = /^$/;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },

    //LOOSE VALIDATION
    looselyValidateNumber: (val) => {
      if ($.trim(val) == "") {
        //if the val is empty, don't check anything
        return true;
      } else {
        //if the val isn't empty, check if the value conforms to this pattern
        return Utilities.ValidationFactory.validateNumber(val);
      }
    },
    looselyValidateDecNumber: (val) => {
      if ($.trim(val) == "") {
        //if the val is empty, don't check anything
        return true;
      } else {
        //if the val isn't empty, check if the value conforms to this pattern
        return Utilities.ValidationFactory.validateDecNumber(val);
      }
    },
    looselyValidateAlphaNumericAllowSpace: (val) => {
      if ($.trim(val) == "") {
        //if the val is empty, don't check anything
        return true;
      } else {
        //if the val isn't empty, check if the value conforms to this pattern
        return Utilities.ValidationFactory.validateAlphaNumericAllowSpace(val);
      }
    },
    looselyValidateEmailNoUnicode: (val) => {
      if ($.trim(val) == "") {
        //if the val is empty, don't check anything
        return true;
      } else {
        //if the val isn't empty, check if the value conforms to this pattern
        return Utilities.ValidationFactory.validateEmailNoUnicode(val);
      }
    },
    looselyValidateEmailWithUnicode: (val) => {
      if ($.trim(val) == "") {
        //if the val is empty, don't check anything
        return true;
      } else {
        //if the val isn't empty, check if the value conforms to this pattern
        return Utilities.ValidationFactory.validateEmailWithUnicode(val);
      }
    },
    looselyValidatePlainString: (val) => {
      if ($.trim(val) == "") {
        //if the val is empty, don't check anything
        return true;
      } else {
        //if the val isn't empty, check if the value conforms to this pattern
        return Utilities.ValidationFactory.validateAlpha(val);
      }
    },
    looselyValidateAlphaNumericAllowExtraChar: (val) => {
      if ($.trim(val) == "") {
        //if the val is empty, don't check anything
        return true;
      } else {
        //if the val isn't empty, check if the value conforms to this pattern
        return Utilities.ValidationFactory.validateAlphaNumericAllowExtraChar(
          val
        );
      }
    },
    noValidation: () => {
      return true;
    },
    validateYYYYMMDate: (val) => {
      let pattern = /^\d{4}\-(0[1-9]|1[012])$/gm;
      if (pattern.test($.trim(val))) {
        return true;
      } else {
        return false;
      }
    },
    //IS SAME
  },

  getNonRequiredFields: function (inputs, requiredInputs) {
    //GIVEN INPUTS AND REQUIREDINPUTS, REQUIREDINPUTS ARE SUBSTRACTED FROM INPUTS TO GIVE YOU NON-REQUIREDINPUTS
    let ids = [];
    let nonReqFieldsVals = [];
    inputs.each(function () {
      ids.push($(this).attr("id"));
    });
    $.each(requiredInputs, function (j) {
      ids.splice($.inArray(requiredInputs[j], ids), 1);
    });
    ids.forEach(function (id) {
      let val = $("#" + id).val();
      nonReqFieldsVals.push(val);
    });
    return nonReqFieldsVals;
  }, //end of getNonRequiredFields function

  getRequiredFields: function (requiredInputs) {
    let errorFields = [];
    let reqFieldsVals = [];
    //forEach is used because it is synchronous
    requiredInputs.forEach(function (reqId) {
      reqValue = $("#" + reqId).val();
      if ($.trim(reqValue) != "") {
        reqFieldsVals.push(reqValue);
      } else {
        errorFields.push(reqId);
      }
    });
    let reqFieldsLen = reqFieldsVals.length;
    let reqInputLength = requiredInputs.length;
    if (reqFieldsLen === reqInputLength) {
      reqFieldsVals.push("success");
      return reqFieldsVals;
    } else {
      errorFields.push("error");
      return errorFields;
    }
  }, //end of getRequiredFields function
  hasDuplicateObjects(array, key) {
    const seen = new Set();
    for (const item of array) {
      const keyValue = key ? item[key] : JSON.stringify(item);
      if (seen.has(keyValue)) {
        return true;
      }
      seen.add(keyValue);
    }
    return false;
  },
  bytesConverter: function (bytes) {
    let unit = 1000;
    if (bytes < unit) return bytes;
    let exp = Math.floor(Math.log(bytes) / Math.log(unit));
    let pre = "kMGTPE".charAt(exp - 1);
    let result = bytes / Math.pow(unit, exp);
    if (result / 100 < 1) return Math.round(result * 10) / 10 + pre;
    else return Math.round(result) + pre;
  },

  breakArray: function (longArray, arraySize) {
    let smallerArrays = [];
    for (let i = 0; i < Math.ceil(longArray.length / arraySize); i++) {
      smallerArrays.push(
        longArray.slice(i * arraySize, i * arraySize + arraySize)
      );
    }
    return smallerArrays;
  }, //end of breakArray function

  postItems: function (item, callback) {
    $.getScript("../js/custom/ajax.js").done(function () {
      let myAjax = new MyAjax();
      myAjax.post("pData=" + item, callback);
    });
  }, //end of postItems

  postFiles: function (item, callback) {
    $.getScript("../js/custom/ajax.js").done(function () {
      let myAjax = new MyAjax();
      myAjax.postFile(item, callback);
    });
  }, //end of postItems

  getItems: function (item, callback) {
    $.getScript("../js/custom/ajax.js").done(function () {
      let myAjax = new MyAjax();
      myAjax.get("gData=" + item, callback);
    });
  }, //end of getItems

  guidGenerator() {
    let S4 = () => {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
    };
    return (
      S4() +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      "-" +
      S4() +
      S4() +
      S4()
    );
  },
  destroyDatatable(table) {
    if ($.fn.DataTable.isDataTable(table)) {
      $(table).DataTable().clear().destroy();
      $("#data_tbl").empty();
    }
  },
  createTableRow(cols) {
    let tr = "<tr>";
    for (let i = 0; i < cols.length; i++) {
      tr += "<td>" + cols[i] + "</td>";
    }
    tr += "</tr>";
    return tr;
  },

  redirectTo: function (redirectUrl, arg, value) {
    let form = $(
      '<form id="tokenForm" action="' +
        redirectUrl +
        '" method="POST">' +
        '<input type="hidden" name="' +
        arg +
        '" value="' +
        value +
        '"></input>' +
        "</form>"
    );
    $("body").append(form);
    $(form).submit();
  },
  setCookie(cname, cvalue, expDays, path = "/") {
    const d = new Date();
    d.setTime(d.getTime() + expDays * 24 * 60 * 60 * 1000);
    let expires = `expires=${d.toUTCString()}`;
    let p = `path=${path}`;
    document.cookie = `${cname}=${cvalue};${expires};${p}`;
  },
  getCookie(cname) {
    let name = `${cname}=`;
    let ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
  },
  getUrlFileName() {
    let url = window.location.pathname;
    let filename = url.substring(url.lastIndexOf("/") + 1);
    return filename;
  },
  addIdentfier: function (value, identfier) {
    if ($.trim(value) != "") {
      value = value + "(" + identfier + ")";
    }
    return value;
  }, //end of addIdentifier function

  generateUuid: function () {
    let s = [];
    let hexDigits = "0123456789abcdef";
    for (let i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4"; // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1); // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23];

    let uuid = s.join("");
    return uuid;
  }, //end of function

  renderToPrint: function (printable, css) {
    let myWindow = window.open("", "", "width=600,height=600");
    let html = printable.html();
    myWindow.document.write(
      "<html><head>" + css + "</head><body>" + html + "</body></html>"
    );
    setTimeout(function () {
      myWindow.document.close();
      myWindow.focus();
      myWindow.print();
      myWindow.close();
    }, 3000);
  },
  renderPrintablePage: function (printable, css) {
    let myWindow = window.open("", "", "width=600,height=600");
    let html = printable.html();
    myWindow.document.write(
      "<html><head>" + css + "</head><body>" + html + "</body></html>"
    );
  },

  getDistinct(items) {
    let first = items[0];
    let res = [first];
    for (let i = 0; i < items.length; i++) {
      let current = items[i];
      if (first != current) {
        if (!res.includes(current)) {
          res.push(current);
        }
        first = current;
      }
    }
    return res;
  }, //fn
  //works on item,value (key value pairs) object in an array
  getItemsToGroup(details) {
    let items = [];
    for (let i = 0; i < details.length; i++) {
      items.push(details[i].item);
    }
    return items;
  }, //fn

  //works on item,value (key value pairs) object in an array
  /**  groupBy : is an array of some items that will used to categories the details variable
   *
   */
  group(groupBy, details) {
    let array = [];
    for (let i = 0; i < groupBy.length; i++) {
      let subArray = [];
      let valueToLookFor = groupBy[i];
      for (let j = 0; j < details.length; j++) {
        if (details[j].item.includes(valueToLookFor)) {
          subArray.push(details[j]);
        }
      }
      array.push(subArray);
    }
    return array;
  }, //fn

  //given an array of objects, this function will group the elements in the array by a selected key in the objects
  groupArrayObjectByASelectedKey(arrayObject, key) {
    let array = [];
    let visited = [];
    for (let i = 0; i < arrayObject.length; i++) {
      let subArray = [];
      let firstKey = arrayObject[i][key];
      if (!visited.includes(firstKey)) {
        for (let j = 0; j < arrayObject.length; j++) {
          let newKey = arrayObject[j][key];
          if (firstKey == newKey) {
            subArray.push(arrayObject[j]);
          }
        }
        visited.push(firstKey);
      }
      if (subArray.length != 0) array.push(subArray);
    }
    return array;
  },

  getUrlHash() {
    return window.location.hash.substr(1);
  },

  getRandomColor() {
    let letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  },

  paginate: {
    settings: {
      currentPage: 1,
      paginatedData: null,
      totalPages: 0,
    },
    paginateData(data, recordsPerPage) {
      let page = [];
      let pages = {};
      let pageNum = 1;
      for (let i = 0; i < data.length; i++) {
        if (page.length < recordsPerPage) {
          page.push(data[i]);
          if (page.length == recordsPerPage) {
            pages[pageNum] = page;
            pageNum += 1;
            page = [];
          }
        }
      }
      pages[pageNum++] = page;
      return pages;
    },
    first(paginateObject, callback) {
      paginateObject.settings.currentPage = 1;
      if (
        paginateObject.settings.paginatedData[
          paginateObject.settings.currentPage
        ] != undefined
      ) {
        callback(
          paginateObject.settings.paginatedData[
            paginateObject.settings.currentPage
          ]
        );
      }
    },
    last(paginateObject, callback) {
      let lastPage = paginateObject.settings.totalPages;
      paginateObject.settings.currentPage = lastPage;
      if (
        paginateObject.settings.paginatedData[
          paginateObject.settings.currentPage
        ] != undefined
      ) {
        callback(
          paginateObject.settings.paginatedData[
            paginateObject.settings.currentPage
          ]
        );
      }
    },
    next(paginateObject, callback) {
      if (
        paginateObject.settings.currentPage < paginateObject.settings.totalPages
      ) {
        paginateObject.settings.currentPage += 1;
        if (
          paginateObject.settings.paginatedData[
            paginateObject.settings.currentPage
          ] != undefined
        ) {
          callback(
            paginateObject.settings.paginatedData[
              paginateObject.settings.currentPage
            ]
          );
        }
      }
    },
    previous(paginateObject, callback) {
      if (paginateObject.settings.currentPage >= 1) {
        paginateObject.settings.currentPage -= 1;
        if (paginateObject.settings.currentPage <= 0)
          paginateObject.settings.currentPage = 1;
        if (
          paginateObject.settings.paginatedData[
            paginateObject.settings.currentPage
          ] != undefined
        ) {
          callback(
            paginateObject.settings.paginatedData[
              paginateObject.settings.currentPage
            ]
          );
        }
      }
    },
  },
}; //end of Utilities Class
// export { Utilities };