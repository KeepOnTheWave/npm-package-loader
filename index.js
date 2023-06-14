const axios = require('axios');
const https = require('https');
const fs = require('fs/promises');
const path = require('path')

const packet = {
    name: 'express',
    version: 'latest'
};

async function downloadFile(url, distDirName) {
    return new Promise(async (resolve, reject) => {
        const filename = path.basename(url);

        await fs.mkdir(
            path.resolve(__dirname, distDirName)
        )

        https.get(url, (res) => {
            const fileStream = fs.createWriteStream(path.resolve(__dirname, distDirName, filename));
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
    const {data} = await axios.get(`https://registry.npmjs.org/${name}/${version}`);
    return data;
}

async function installPackage(packet) {
    console.log(`>> Install ${packet.name}:${packet.version}`);

    const metadata = await getMetadata(packet);
    const tarball_url = metadata.dist.tarball;

    await downloadFile(tarball_url, 'dist');
}

installPackage(packet)