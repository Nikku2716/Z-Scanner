package zapclient

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

type Client struct {
	baseURL string
	apiKey  string
	http    *http.Client
}

func New(host, apiKey string) *Client {
	return &Client{
		baseURL: host,
		apiKey:  apiKey,
		http: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *Client) get(path string, params url.Values) (map[string]any, error) {
	if params == nil {
		params = url.Values{}
	}
	params.Set("apikey", c.apiKey)

	u := fmt.Sprintf("%s/JSON/%s?%s", c.baseURL, path, params.Encode())
	resp, err := c.http.Get(u)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("zap API error %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]any
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, err
	}
	return result, nil
}

func (c *Client) Version() (string, error) {
	result, err := c.get("core/view/version/", nil)
	if err != nil {
		return "", err
	}
	return fmt.Sprint(result["version"]), nil
}

func (c *Client) NewSession(name string) error {
	params := url.Values{}
	params.Set("name", name)
	params.Set("overwrite", "true")
	_, err := c.get("core/action/newSession/", params)
	return err
}

func (c *Client) AccessURL(target string) error {
	params := url.Values{}
	params.Set("url", target)
	params.Set("followRedirects", "true")
	_, err := c.get("core/action/accessUrl/", params)
	return err
}

func (c *Client) WaitForReady(maxAttempts int) error {
	for i := 0; i < maxAttempts; i++ {
		_, err := c.Version()
		if err == nil {
			return nil
		}
		time.Sleep(2 * time.Second)
	}
	return fmt.Errorf("zap daemon not ready after %d attempts", maxAttempts)
}
