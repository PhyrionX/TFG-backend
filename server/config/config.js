module.exports = {
    db: {
        production:"mongodb://admin:admin@ds011472.mlab.com:11472/tfg",
        test:"mongodb://localhost:27017/tfg"
    },
    TOKEN_SECRET: process.env.TOKEN_SECRET || "clavePrivadaToOp",
    port: "8081",
}