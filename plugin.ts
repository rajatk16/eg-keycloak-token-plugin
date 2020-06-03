import * as eg from 'express-gateway'
import {createLoggerWithLabel} from 'express-gateway/lib/logger'
import * as Keycloak from 'keycloak-connect'
import * as session from 'express-session'
import * as createMemoryStore from 'memorystore'

interface KeycloakPluginSettings {
  session: session.SessionOptions;
  keycloakConfig: object;
  paths: string[];
  registerName: string;
}

interface ActionParams {
  jsProtect?: string;
  jsProtectTokenVar: string;
  role?: string;
}

const memorystore = createMemoryStore(session);

const DEFAULT_KEYCLOAK_PLUGIN_SETTINGS: KeycloakPluginSettings = {
  session: {
    secret: 'keycloak_secret'
  },
  keycloakConfig: {},
  registerName: 'keycloak-protect',
  paths: ['/']
}

const keycloakPlugin: eg.ExpressGateway.Plugin = {
  version: '1.2.0',
  policies: ["keycloak-protect"],
  init: (ctx: eg.ExpressGateway.PluginContext) => {
    const sessionStore = new memorystore()
    const rawSettings: KeycloakPluginSettings = 
      //@ts-ignore
      (ctx as eg.ExpressGateway.PluginContext).settings;
    const sessionSettings = {
      ...DEFAULT_KEYCLOAK_PLUGIN_SETTINGS.session,
      ...rawSettings.session,
      store: sessionStore
    };
    const keycloakConfig = {
      ...DEFAULT_KEYCLOAK_PLUGIN_SETTINGS.keycloakConfig,
      ...rawSettings.keycloakConfig
    }
    const pluginSettings: KeycloakPluginSettings = {
      session: sessionSettings,
      keycloakConfig,
      registerName:
        rawSettings.registerName || DEFAULT_KEYCLOAK_PLUGIN_SETTINGS.registerName,
      paths: rawSettings.paths || DEFAULT_KEYCLOAK_PLUGIN_SETTINGS.paths
    };
    const keycloak = new Keycloak(
      {
        store: sessionStore
      },
      //@ts-ignore
      pluginSettings.keycloakConfig
    )
    const logger = createLoggerWithLabel(['KEYCLOAK: '])
    logger.debug(`Initialized Express Gateway Policy ${pluginSettings.registerName}`)
    logger.info(`${JSON.stringify(pluginSettings, null, '\t')}`)

    keycloak.authenticated = req => {
      //@ts-ignore
      const grant = req.kauth.grant as Keycloak.Grant
      logger.info(`Keycloak Authenticated: ${JSON.stringify(grant.access_token, null, `\t`)}`)
    }

    keycloak.accessDenied = (req, res) => {
      logger.debug('Access Denied')
      logger.warn('Invalid Bearer Token')
      res.status(403).json({
        status: "Fail",
        message: "Please Try Logging In Again"
      })
    }

    ctx.registerGatewayRoute(app => {
      logger.debug('Register', ctx);
      logger.info('Registering Keycloak Middleware')
      //@ts-ignore
      app.use(pluginSettings.paths, session(pluginSettings.session))
      app.use(pluginSettings.paths, keycloak.middleware())
    })

    ctx.registerPolicy({
      name: pluginSettings.registerName,
      policy: (actionParams: ActionParams) => {
        logger.debug(`Policy: ${pluginSettings.registerName}`)
        return keycloak.protect()
      }
    })
  }
}

export {
  KeycloakPluginSettings as IKeycloakPluginSettings,
  DEFAULT_KEYCLOAK_PLUGIN_SETTINGS as DefaultKeycloakPluginSettings,
  keycloakPlugin as KeycloakPlugin,
  keycloakPlugin as default
}