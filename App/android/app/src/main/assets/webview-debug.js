// Override console.log to send messages to React Native
(function() {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  
  console.log = function(...args) {
    originalConsoleLog.apply(console, args);
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'console',
      level: 'log',
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')
    }));
  };
  
  console.error = function(...args) {
    originalConsoleError.apply(console, args);
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'console',
      level: 'error',
      message: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ')
    }));
  };
  
  // Add a global error handler
  window.addEventListener('error', function(event) {
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'error',
      message: 'JavaScript error: ' + event.message + ' at ' + event.filename + ':' + event.lineno
    }));
    return false;
  });
  
  true;
})(); 