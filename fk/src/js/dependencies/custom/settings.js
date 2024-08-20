import { MailruIcon } from "react-share";

var domainSettings = {
    dbName: 'postitonline',
    dbVersion: 1,
    dbTables: [{
        tblName: 'user',
        tblOpt: { autoIncrement: true },
        tblIndexes: [{ indexName: 'user', indexOpt: { unique: true } }]
    },
    ],
    //P73/V PENKWASE, BS-0080-6744 
    appName: 'Postitonlinegh',
    appMail: 'support@postitonlinegh.com',
    numPopularToAppearOnCategoryTop: 5,
    googleClientUrl: 'https://accounts.google.com/gsi/client',
    googleClientID: '720696234161-050k7elpoios13i2ocfpu7el28k4ae5v.apps.googleusercontent.com',
    facebookAppID: 597121861801078,
    primaryColor: 'pinkx darken-4x special-color-darkx brownx darken-4x teal darken-4',
    secondaryColor: 'pinkx darken-1x special-colorx brownx darken-1x deep-turquiose',
    textColor: 'blue-grey-text',
    primaryColorHex: '#004d40',
    secondaryColorHex: '#1e847f',
    textColorHex: '#607d8b',

    // backend: 'http://192.168.8.127:3002',//home
    // backend: 'http://192.168.2.101:3002',//campus
    // backend:'http://192.168.223.9:3002',//android
    backend: 'http://localhost:3002',
    // checkIndex:'https://finance.aamusted.edu.gh/tpapi/check_index'
    // checkIndex: 'https://89.116.229.137:8090/preview/finance.aamusted.edu.gh/tpapi/check_index'

}

export default domainSettings;


