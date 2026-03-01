declare module 'google-auth-library' {
  export interface Credentials {
    access_token?: string | null;
    refresh_token?: string | null;
    token_type?: string;
    expiry_date?: number | null;
    id_token?: string | null;
  }

  export interface TokenPayload {
    iss: string;
    sub: string;
    aud: string;
    iat: number;
    exp: number;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
    given_name?: string;
    family_name?: string;
    locale?: string;
    hd?: string;
  }

  export interface IdTokenPayload {
    payload: TokenPayload;
  }

  export interface GetTokenOptions {
    code: string;
    codeVerifier?: string;
  }

  export interface OAuth2ClientOptions {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  }

  export interface RefreshOptions {
    forceRefreshOnFailure?: boolean;
    eagerRefreshThresholdMillis?: number;
  }

  export interface GetAccessTokenResponse {
    token?: string | null;
    res?: object | null;
  }

  export interface ProjectInfo {
    projectId: string;
  }

  export interface RequestOptions {
    url: string;
    method?: string;
    headers?: { [key: string]: string };
    body?: string | object;
    data?: unknown;
  }

  export class OAuth2Client {
    constructor(clientId?: string, clientSecret?: string, redirectUri?: string);
    constructor(options: OAuth2ClientOptions);
    generateAuthUrl(options: {
      access_type?: string;
      scope?: string | string[];
      prompt?: string;
      state?: string;
      include_granted_scopes?: boolean;
      login_hint?: string;
    }): string;
    getToken(code: string): Promise<{ tokens: Credentials }>;
    getToken(options: GetTokenOptions): Promise<{ tokens: Credentials }>;
    refreshAccessToken(): Promise<{ credentials: Credentials }>;
    setCredentials(credentials: Credentials): void;
    getAccessToken(): Promise<GetAccessTokenResponse>;
    getIdTokenPayload(): Promise<IdTokenPayload>;
    getRequestHeaders(): Promise<{ Authorization: string }>;
    request<T>(options: RequestOptions): Promise<{ data: T }>;
    verifyIdToken(options: {
      idToken: string;
      audience: string | string[];
    }): Promise<{ getPayload: () => TokenPayload | undefined }>;
    on(event: 'tokens', listener: (tokens: Credentials) => void): this;
    refreshRequestHeaders(): Promise<void>;
  }

  export interface GoogleAuthOptions<_T extends OAuth2Client = OAuth2Client> {
    scopes?: string | string[];
    clientOptions?: OAuth2ClientOptions;
    credentials?: object;
    keyFilename?: string;
    keyFile?: string;
    projectId?: string;
    projectIdRequired?: boolean;
    userAgent?: string;
    forceRefreshOnFailure?: boolean;
    eagerRefreshThresholdMillis?: number;
  }

  export class GoogleAuth<T extends OAuth2Client = OAuth2Client> {
    constructor(options?: GoogleAuthOptions<T>);
    getClient(): Promise<T>;
    getProjectId(): Promise<string>;
    getAccessToken(): Promise<{ token?: string; res?: object }>;
    getRequestHeaders(url?: string): Promise<{ [key: string]: string }>;
    request<R>(options: RequestOptions): Promise<{ data: R }>;
    getCredentials(): Promise<{ client_email?: string; private_key?: string }>;
    sign(blob: string): Promise<{ signedBlob: string; keyId: string }>;
  }

  export class UserRefreshClient extends OAuth2Client {
    constructor(
      clientId?: string,
      clientSecret?: string,
      refreshToken?: string,
    );
    constructor(options: {
      clientId?: string;
      clientSecret?: string;
      refreshToken?: string;
    });
    refreshAccessToken(): Promise<{ credentials: Credentials }>;
  }

  export interface JWTInput {
    type?: string;
    client_email?: string;
    private_key?: string;
    private_key_id?: string;
    project_id?: string;
    client_id?: string;
    auth_uri?: string;
    token_uri?: string;
    auth_provider_x509_cert_url?: string;
    client_x509_cert_url?: string;
    refresh_token?: string;
  }

  export class JWT extends OAuth2Client {
    constructor(
      email?: string,
      keyFile?: string,
      key?: string,
      scopes?: string | string[],
      subject?: string,
    );
    fromJSON(json: JWTInput): void;
    fromStream(stream: NodeJS.ReadableStream): Promise<void>;
    authorize(): Promise<Credentials>;
    request<T>(options: object): Promise<{ data: T }>;
  }

  export class Compute extends OAuth2Client {
    constructor(options?: { serviceAccountEmail?: string });
    getAccessToken(): Promise<GetAccessTokenResponse>;
    request<T>(options: object): Promise<{ data: T }>;
  }

  export class Impersonate {
    constructor(options: {
      sourceClient: OAuth2Client;
      targetPrincipal: string;
      targetScopes: string[];
      delegates?: string[];
      lifetime?: number;
    });
    getAccessToken(): Promise<{ token: string; expireTime: string }>;
  }
}
