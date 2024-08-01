const jwt = require('jsonwebtoken')


async function refresh(req, res, next){
    try{
        const {refreshToken} = req.cookies

        if(!refreshToken){
            return res.status(409).json({ok: false, msg: 'Provide refresh token'})
        }
        try {
           
            const decoded = await jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
            

            const accessToken = jwt.sign(
                { user: { username:decoded.user.username, id:decoded.user.id } },
                process.env.JWT_ACCESS_SECRET,
                { expiresIn: '30s' })
              
            req.accessToken = accessToken

            return next()
        } catch (err) {
            return res.status(err.response?.status || 500).json({ ok: false, msg: err.message });
        }
    }catch(e){
        return res.status(e.response?.status || 500).json({ ok: false, msg: e.message })
    }
} 


module.exports = {refresh}