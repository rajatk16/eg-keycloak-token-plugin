import * as eg from 'express-gateway';
import * as session from 'express-session';
interface KeycloakPluginSettings {
    session: session.SessionOptions;
    keycloakConfig: object;
    paths: string[];
    registerName: string;
}
declare const DEFAULT_KEYCLOAK_PLUGIN_SETTINGS: KeycloakPluginSettings;
declare const keycloakPlugin: eg.ExpressGateway.Plugin;
export { KeycloakPluginSettings as IKeycloakPluginSettings, DEFAULT_KEYCLOAK_PLUGIN_SETTINGS as DefaultKeycloakPluginSettings, keycloakPlugin as KeycloakPlugin, keycloakPlugin as default };
