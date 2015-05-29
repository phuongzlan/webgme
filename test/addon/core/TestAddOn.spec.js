/*jshint node:true, mocha:true, expr:true*/
/**
 * @author pmeijer / https://github.com/pmeijer
 */

var testFixture = require('../../_globals');

describe('TestAddOn', function () {
    'use strict';

    var expect = testFixture.expect,
        WebGME = testFixture.WebGME,
        Core = testFixture.WebGME.core,
        logger = testFixture.logger.fork('TestAddOn.spec'),
        server,
        storage,
        project,
        importParam,
        gmeConfig = testFixture.getGmeConfig(),
        addOnName = 'TestAddOn',
        TestAddOn = testFixture.requirejs('addon/' + addOnName + '/' + addOnName + '/' + addOnName);

    before(function (done) {
        server = WebGME.standaloneServer(gmeConfig);
        server.start(function (err) {
            expect(err).to.not.exist;
            storage = testFixture.NodeStorage.createStorage(server.getUrl(), 'testopencontext', logger, gmeConfig);
            //new WebGME.clientStorage({
            //    globConf: gmeConfig,
            //    type: 'node',
            //    host: (gmeConfig.server.https.enable === true ? 'https' : 'http') + '://127.0.0.1',
            //    logger: logger.fork(addOnName + ':storage'),
            //    webGMESessionId: 'testopencontext'
            //});
            //storage = storage;
            done();
        });
    });

    afterEach(function (done) {
        storage.deleteProject(importParam.projectName, function (err) {
            done(err);
        });
    });

    after(function (done) {

        server.stop(function (err2) {
            done(err2 || null);
        });
    });

    it('should start, update and stop', function (done) {
        importParam = {
            projectSeed: './test/addon/core/TestAddOn/project.json',
            projectName: 'TestAddOn',
            branchName: 'master',
            gmeConfig: gmeConfig,
            logger: logger
        };
        testFixture.importProject(storage, importParam, function (err, result) {
            var startParam,
                logMessages = [],
                logger = logger.fork(addOnName),
                addOn;
            expect(err).equal(null);

            logger.info = function () {
                logMessages.push(arguments);
            };

            project = result.project;

            addOn = new TestAddOn(Core, storage, gmeConfig);

            startParam = {
                projectName: 'TestAddOn',
                branchName: 'master',
                project: project,
                logger: logger
            };

            addOn.start(startParam, function (err) {
                expect(err).equal(null);
                result.core.createNode(result.root, {base: '/1'}, 'new FCO instance');
                //FIXME: Currently the addOn is using the same project and core.
                testFixture.saveChanges({project: project, core: result.core, rootNode: result.root},
                    function (err, rootHash, commitHash) {
                        expect(err).equal(null);
                        logger.debug(rootHash);
                        logger.debug(commitHash);

                        logger.debug(logMessages);
                        addOn.stop(function (err) {
                            expect(err).equal(null);
                            logger.debug(logMessages);
                            expect(logMessages.length).to.equal(3);
                            expect(logMessages[0][2]).to.equal('start');
                            expect(logMessages[1][2]).to.equal('update');
                            expect(logMessages[1][4]).to.equal(rootHash);
                            expect(logMessages[2][2]).to.equal('stop');
                            done();
                        });
                    }
                );

            });
        });
    });


});
