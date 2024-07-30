const jwt = require('jsonwebtoken')


async function accessProtect(req, res, next){
    const accessToken = req.cookies.accessToken || req.accessToken
    
    if(!accessToken){
        return res.status(409).json({ok: false, msg: 'Provide access token'})
    }

    await jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET, (err, decoded) => {
        if(err)  return res.status(err.response?.status || 500).json({ ok: false, msg: err.message })
        
        req.user = {id: decoded.user.id}

        return next()
    })
}

module.exports = {accessProtect}