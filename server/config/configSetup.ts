const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test' || env === 'production') {
    const config = require('./config.json');
    const envConfig = config[env];
    Object.keys(envConfig).forEach((key: string) => {
        process.env[key] = envConfig[key];
    });
}
