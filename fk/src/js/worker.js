const workercode = () => {        
    onmessage = function (event) {
        console.log('Received message from the main thread:', event.data);
        // Perform some computation
        const result = event.data * 2;      
        // Send the result back to the main thread
        postMessage(result);
    };
};


let code = workercode.toString();
// code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));
const blob = new Blob([code], { type: "application/javascript" });
const worker_script = URL.createObjectURL(blob);

module.exports = worker_script;
