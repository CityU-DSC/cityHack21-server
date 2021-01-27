
const forbiddenList = ['password', 'tokens'];

function clearFields(obj){
    if (obj instanceof Object){
        for (let key in obj){
            if (forbiddenList.includes(key)){
                delete obj[key];
            } else {
                clearFields(obj[key]);
            }
        }
    }
}

function requestHandler(executionFunction) {
    return async function(req,res,next) {
		try
		{
			let response = await executionFunction(req);
			if (response == undefined || response == null){
				response = {}
			} else if (typeof response != 'object'){
				response = { result: response }
			}
            response.success = true;
            response = JSON.parse(JSON.stringify(response));
            clearFields(response);
            return res.status(response.status? response.status: 200).json(response);
		} catch (err) {
            if (err.message){
                console.log(err.message);
            } else {
                console.log(err);
            }
            res.status(err.status? err.status: 400).json({
                success: false,
                error: err,
                message: err.message
            })
            // throw err;
		}
	}
}

module.exports = {
	requestHandler,
}


