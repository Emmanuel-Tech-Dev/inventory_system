
function MyAjax(){    
    this.get = function(data,callback){                
        $.ajax({
            type: "GET",
            data: data,
            url: "controllers/app.php",
            success:callback,
            cache: false,
            contentType: false,
            processData: false
        });       
    }    
    
    this.post = function(data,callback){         
        $.ajax({
            type: "POST",
            data: data,
            url: "controllers/app.php",
            success:callback,        
            cache: false,
            // contentType: false,
            processData: false
        });         
    }

    this.postFile = function(data,callback){         
        $.ajax({
            type: "POST",
            enctype: 'multipart/form-data',
            data: data,
            url: "controllers/app.php",
            success:callback,        
            cache: false,            
            contentType: false,
            processData: false
        });          
    }

    this.authorize = function(url,data){
        $.ajax({
            type: 'POST',
            url: url,
            headers: {
                "Authorization": "Basic " + data
            },
            success : function(){

            },
            error: function (xhr,ajaxOptions,throwError){
            //Error block 
          },
        });

    }
}
