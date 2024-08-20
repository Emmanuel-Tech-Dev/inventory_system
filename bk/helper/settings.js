var Settings = {
    paystackKey: 'sk_test_57938e8758a2ad924b80ab3bf9f2e150296800ae',
    paystackUrl: 'https://api.paystack.co/transaction/initialize',
    paystackVerifyUrl: 'https://api.paystack.co/transaction/verify',
    clientHost: 'http://localhost:3000',
    serverHost: 'http://localhost:3002',
    minTrendingAds: 24,
    facebookAppSecret: '0f65438fede751bfc908d4ba2f02f0dc',
    facebookAppId: '597121861801078',

    JWTKEYPATHPRIVATE: './keys/localserver_jwts/private.pem',
    JWTKEYPATHPUBLIC: './keys/localserver_jwts/public.pem',
    JWTKEYPATH: './keys/localserver_jwts/public.pem',//alias for public key
    JWTSYMKEY: '',
    JWTREFRESHTOKENKEY: '',
    JWTEMAILTOKENKEY: '',

  
    mnotifySmsSender: '',
    mnotifySmsHost: "https://api.mnotify.com/api/sms/quick?key=",
    mnotifySmsKey: "",
    // PAYMENT_VERIFICATION_ENDPOINT: 'http://localhost/aamusted_finance/tpapi/get_eligible_registrants',
    // STUDENT_TRANSACTIONS_ENDPOINT: 'http://localhost/aamusted_finance/tpapi/get_student_payments',
    // STUDENT_PROGRAM_SESSION_CHANGE_ENDPOINT: 'http://localhost/aamusted_finance/tpapi/change_student_program_session',
    // CRON_JOB_ENDPOINT:'http://localhost/aamusted_finance/tpapi/run_job'    
}

module.exports = Settings;