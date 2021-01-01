
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
            throw err;
		}
	}
}

module.exports = {
	requestHandler,
}

