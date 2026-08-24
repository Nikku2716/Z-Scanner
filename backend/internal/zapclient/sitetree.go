package zapclient

import (
	"encoding/json"
	"fmt"
	"net/url"
)

// SiteNode is one node in ZAP's site tree, as returned by
// core/view/siteTree or its child-nodes variant.
type SiteNode struct {
	Name        string `json:"name"`        // display label
	URL         string `json:"url"`         // full URL (may be empty on structural nodes)
	Method      string `json:"method"`      // HTTP method for leaf nodes
	StatusCode  string `json:"statusCode"`  // numeric string
	ContentType string `json:"contentType"` // response content type, may be empty
}

// GetSiteTree returns the full site tree for a target.
func (c *Client) GetSiteTree() ([]SiteNode, error) {
	result, err := c.get("core/view/sites/", nil)
	if err != nil {
		return nil, err
	}
	return parseSiteNodes(result["sites"])
}

// GetURLs returns every URL ZAP has seen for the target via the spider
// results view. This catches URLs the site tree collapses.
func (c *Client) GetURLs(baseURL string) ([]string, error) {
	params := url.Values{}
	if baseURL != "" {
		params.Set("baseurl", baseURL)
	}
	result, err := c.get("spider/view/allUrls/", params)
	if err != nil {
		return nil, err
	}
	raw, ok := result["allUrls"]
	if !ok {
		return nil, nil
	}
	data, err := json.Marshal(raw)
	if err != nil {
		return nil, err
	}
	var urls []string
	if err := json.Unmarshal(data, &urls); err != nil {
		return nil, fmt.Errorf("parse urls: %w", err)
	}
	return urls, nil
}

func parseSiteNodes(raw any) ([]SiteNode, error) {
	if raw == nil {
		return nil, nil
	}
	data, err := json.Marshal(raw)
	if err != nil {
		return nil, err
	}
	var nodes []SiteNode
	if err := json.Unmarshal(data, &nodes); err != nil {
		return nil, fmt.Errorf("parse sites: %w", err)
	}
	return nodes, nil
}
