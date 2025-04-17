var S3Utils;
(function (S3Utils) {
    S3Utils.loadJson = async (s3, bucket, key) => {
        try {
            const object = await s3.getObject({
                Bucket: bucket,
                Key: key
            }).promise();
            const body = object.Body;
            if (!body) {
                return null;
            }
            return JSON.parse(body.toString());
        }
        catch (e) {
            if (e.code === "NoSuchKey") {
                return null;
            }
            throw e;
        }
    };
    S3Utils.saveJson = async (s3, bucket, key, data) => {
        await s3.putObject({
            Bucket: bucket,
            Key: key,
            Body: JSON.stringify(data)
        }).promise();
    };
})(S3Utils || (S3Utils = {}));
export default S3Utils;
//# sourceMappingURL=s3-utils.js.map