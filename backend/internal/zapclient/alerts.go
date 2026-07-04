package zapclient

import (
	"encoding/json"
	"fmt"
	"net/url"
)

type ZAPAlert struct {
	PluginID   string `json:"pluginId"`
	AlertRef   string `json:"alertRef"`
	Name       string `json:"name"`
	Risk       string `json:"risk"`
	Confidence string `json:"confidence"`
	URL        string `json:"url"`
	Method     string `json:"method"`
	Param      string `json:"param"`
	Attack     string `json:"attack"`
	Evidence   string `json:"evidence"`
	Description string `json:"description"`
	Solution   string `json:"solution"`
	Reference  string `json:"reference"`
	CWEID      string `json:"cweid"`
	WASCID     string `json:"wascid"`
}

func (c *Client) GetAlerts(baseURL string) ([]ZAPAlert, error) {
	params := url.Values{}
	if baseURL != "" {
		params.Set("baseurl", baseURL)
	}

	result, err := c.get("core/view/alerts/", params)
	if err != nil {
		return nil, err
	}

	alertsRaw, ok := result["alerts"]
	if !ok {
		return nil, nil
	}

	data, err := json.Marshal(alertsRaw)
	if err != nil {
		return nil, err
	}

	var alerts []ZAPAlert
	if err := json.Unmarshal(data, &alerts); err != nil {
		return nil, fmt.Errorf("parse alerts: %w", err)
	}
	return alerts, nil
}
