const axios = require('axios');
const https = require('https');
const fs = require('fs/promises');
const {createWriteStream, existsSync} = require('fs')
const path = require('path')

const packet = {
    name: 'normalize.css',
    version: 'latest',
    // withDev: true
};

const DIR_NAME = /\//.test(packet.name)? packet.name.split('/').join('-') : packet.name;

async function downloadFile(url, distDirName) {
    return new Promise(async (resolve, reject) => {
        const filename = path.basename(url);

        if(!existsSync( path.resolve(__dirname, distDirName)) ) {
            await fs.mkdir(
                path.resolve(__dirname, distDirName)
            )
        }


        https.get(url, (res) => {
            const fileStream = createWriteStream(path.resolve(__dirname, distDirName, filename));
            res.pipe(fileStream);

            fileStream.on('finish', () => {
                fileStream.close();
                console.log('Download finished')
                resolve()
            });
        })
    })
}

async function getMetadata({name, version}) {
    try {
        const {data} = await axios.get(`https://registry.npmjs.org/${name}/${version}`);
        return data;
    } catch (e) {
        const {data} = await axios.get(`https://registry.npmjs.org/${name}/latest`);
        return data
    }
}

async function installPackage(packet) {
    console.log(`>> Install ${packet.name}:${packet.version}`);

    const metadata = await getMetadata(packet);

    const tarball_url = metadata.dist.tarball;

    if(metadata.dependencies) {
        const dependencies = Object
            .entries(metadata.dependencies)
            .map(([name, version]) => {
                console.log(version)
                if(version === '*') {
                    version = 'latest'
                } else if(/\d+\.\d+\.\d+/g.test(version)) {
                    version = version.match(/\d+\.\d+\.\d+/g)[0]
                } else if(/\d+\.\d+/.test(version)) {
                    version = version.match(/\d+\.\d+/g)[0]
                    version += '.0'
                } else if(/\d+/.test(version)) {
                    version = version.match(/\d+/g)[0]
                    version += '.0.0'
                }

                return {
                    name,
                    version
                }
            })
        ;

        const installations = dependencies.map(pack => installPackage(pack))
    }

    if(packet.withDev && metadata.devDependencies) {
        const dependencies = Object
            .entries(metadata.devDependencies)
            .map(([name, version]) => {
                if(/^\d+$/.test(version)) {
                    version = version.match(/^\d+$/g)[0]
                    version += '.0.0'
                } else if(/^\d+\.\d+$/.test(version)) {
                    version = version.match(/^\d+\.\d+$/g)[0]
                    version += '.0'
                } else if(version === '*') {
                    version = 'latest'
                } else {
                    version = version.match(/\d+\.\d+\.\d+/g)[0]
                }

                return {
                    name,
                    version
                }
            })
        ;

        const installations = dependencies.map(pack => installPackage(pack))
    }

    await downloadFile(tarball_url, DIR_NAME);
}

installPackage(packet)